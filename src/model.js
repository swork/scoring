/**
 * Process this.start() response, maybe several times as replication
 * continues; or changes_feed response.  Augment what we know about
 * scores, wait until we have 'config', then notify controller.
 */
function _LeagueDB_got_db_response(change) {
    console.log("got_db_response got this change:", change);
    var got_new_config = false,
        got_new_score = false;

    if ('rows' in change) {
        for (var i=0; i<change.rows.length; ++i) {
            this.got_db_response(change.rows[i]);
        }
    } else if ('error' in change || !('doc' in change) || !change.doc) {
        console.log('got_db_response skipping non-document change:', change);
    } else if ('deleted' in change && change.deleted) {
        console.log('skipping deleted document');
    } else if (change.id === "config") {
        this.config = this.controller.boil_config(change.doc);
        got_new_config = true;
        console.log('got config:', this.config);
    } else if ('score' in change.doc) {
        var s = change.doc.score;  // 2-element array of ints [home/top, away/bot]
        if ( ! ('length' in s) || s.length != 2) {
            console.log("Ignoring invalid score entry for id:", change.id, " value:", s);
        }
        this.scores[change.id] = change.doc;
        got_new_score = true;
        console.log('got score:', change.doc);
    } else {
        console.log('got_db_response skipping unexpected change:', change);
    }

    // Can't do any notifying until we get 'config'. Subsequent
    // arrival of scores will trigger more callbacks here.
    if (this.config) {
        if (got_new_config) {
            this.controller.notify_config(this.config);
            this.controller.notify_scores(this.scores);  // .config might come last?
        } else if (got_new_score) {
            this.controller.notify_scores(this.scores);
        }
    }
}

function _LeagueDB_manage_changes_feed() {
    var that = this;
    function on_change(change) {
        console.log("db start on_change fired", change);
        that.got_db_response(change);
    }
    setTimeout(function() {
        console.log("changes-feed started");
        that.pouch.changes({ 'include_docs': true,
                             'live': true,
                             'onChange': on_change })
            .then(function() { that.manage_changes_feed(); }); }, 2000);
    console.log("changes-feed armed");
}

/**
 * Fetch everything from the local database, and arrange to do so
 * ongoing. 
 */
function _LeagueDB_start() {
    var that = this;
    function on_docs(err, change) {
        console.log("db start on_docs cb err:", err, " docs:", change);
        if (err) {
            setTimeout(function(){that.start();}, 2000);
        } else {
            that.got_db_response(change);
        }
    }
    this.pouch.allDocs({include_docs:true, conflicts:true}, on_docs)
        .then(function () {
            console.log("allDocs done, begin the unending changes feed");
            that.manage_changes_feed();
        });
}

function _LeagueDB_manage_from_replication() {
    var that = this;
    this.controller.report_online("Starting");
    function onChange(err, doc) {
        if (err) {
            that.controller.report_online("Errors");
            that.controller.report_error(err.toString());
        } else {
            that.controller.report_online("Online");
            that.controller.clear_error();
        }
    }
    function from_complete(err, doc) {
        console.log("complete callback in db replicate.from, arguments", arguments);
        that.controller.report_online("Offline");
        if (err) {
            that.controller.report_error(err.toString());
        } else {
            that.controller.clear_error();
        }
        that.from_replication = null;

        setTimeout(function() { that.manage_from_replication(); }, 2000);
    }
    if ( ! this.from_replication) {
        r = PouchDB.replicate(this.remoteDB, this.localDB,
                              { 'onChange': onChange,
                                'complete': from_complete,
                                'live': true });
        this.controller.report_online("Online");
        console.log("replicate-from started, ", this.remoteDB, " to ", this.localDB, " r:", r);
        this.from_replication = r;
    }
}

function _LeagueDB_manage_to_replication() {
    var that = this;
    this.controller.report_online("Starting", true /*up*/);
    function onChange(err, doc) {
        if (err) {
            that.controller.report_online("Errors", true /*up*/);
            that.controller.report_error(err.toString());
        } else {
            that.controller.report_online("Online", true /*up*/);
            that.controller.clear_error();
        }
    }
    function to_complete(err, doc) {
        console.log("complete in db replicate.to, arguments", arguments);
        that.controller.report_online("Offline", true /*up*/);
        if (err) {
            console.log("to_complete err:", err);
            that.controller.report_error(err.toString());

            /* On particular known errors just give up - don't auto-restart. */
            if (err.status === 500 && err.error === 'Replication aborted' && err.reason === 'target.revsDiff completed with error') {
                console.log("##### FATAL ERROR in to-replication, known, not auto-restarting.");
                return;
            }
        } else {
            that.controller.clear_error();
        }
        that.to_replication = null;

        setTimeout(function() { that.manage_to_replication(); }, 2000);
    }
    if ( ! this.to_replication) {
        r = PouchDB.replicate(this.localDB, this.remoteDB,
                              { 'onChange': onChange,
                                'complete': to_complete,
                                'live': true });
        this.controller.report_online("Online", true /*up*/);
        console.log("replicate-to started, ", this.localDB, " to ", this.remoteDB, " r:", r);
        console.log("replicate-to started:", r);
        this.to_replication = r;
    }
}

/**
 * This shouldn't be called if multiple writers are in play: a slow
 * sync could convince one writer to create a doc that already exists
 * elsewhere, and resolving that conflict is hairy.
 */
function _LeagueDB_new_game_doc(key) {
    var round, team0, team1;
    var parts = key.split("_");
    round = parts[0];
    team0 = parts[1];
    team1 = parts[2];
    return { "_id":key, "score": [0,0], "team": [{"color":team0},{"color":team1}] };
}

function _LeagueDB_update_score(gamedoc) {
    if ('team' in gamedoc && gamedoc.team.length === 2 && 'score' in gamedoc && gamedoc.score.length === 2) {
        this.pouch.put(gamedoc);
    } else {
        console.log("ERROR Invalid game doc, no update done.");
    }
}

function LeagueDB(localDB, remoteDB, controller, replicate_bidi) {
    this.localDB = localDB;
    this.remoteDB = remoteDB;
    this.controller = controller || new LeagueDBNullController();
    this.replicate_bidi = replicate_bidi;
    this.config = null;
    this.scores = {};

    // methods
    this.start = _LeagueDB_start;
    this.got_db_response = _LeagueDB_got_db_response;
    this.new_game_doc = _LeagueDB_new_game_doc;
    this.update_score = _LeagueDB_update_score;
    this.manage_from_replication = _LeagueDB_manage_from_replication;
    this.manage_to_replication = _LeagueDB_manage_to_replication;
    this.manage_changes_feed = _LeagueDB_manage_changes_feed;

    console.log(this.localDB);
    this.pouch = new PouchDB(this.localDB);
    this.manage_from_replication();
    this.manage_to_replication();
}

/**
 * Besides a fallback, this documents the controller's DB-facing API. Pretty simple.
 */
function LeagueDBNullController() {
    do_notification = function() {
        console.log("NullController installed - notification, umm, noted.");
    };
    report_online = function(errstr) {
        console.log("NullController installed - online report, umm, noted. (", errstr, ")");
    };
    report_error = function(errstr) {
        console.log("NullController installed - error report, umm, noted. (", errstr, ")");
    };
    clear_error = function(errstr) {
        console.log("NullController installed - error, umm, cleared.");
    };
    boil_config = function(cfg) {
        console.log("NullController installed - boil_config, umm, noted.");
        return cfg;
    };
}
