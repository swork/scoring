/**
 * Process this.start() response, maybe several times as replication
 * continues; or changes_feed response.  Augment what we know about
 * scores, wait until we have 'config', then notify controller.
 */
function _LeagueDB_got_db_response(change) {
    console.log("got_db_response got this change:", change);
    var got_new_config = false,
        got_new_score = false;

    if ('error' in change || !('doc' in change) || !change.doc) {
        console.log('got_db_response skipping non-document change:', change);
    } else if ('deleted' in change && change.deleted) {
        console.log('skipping deleted document');
    } else if (change.id === "config") {
        this.config = this.controller.boil_config(change.doc);
        got_new_config = true;
    } else if ('score' in change.doc) {
        var s = change.doc.score;  // 2-element array of ints [home/top, away/bot]
        if ( ! ('length' in s) || s.length != 2) {
            console.log("Ignoring invalid score entry for id:", change.id, " value:", s);
        }
        this.scores[change.id] = change.doc;
        got_new_score = true;
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

/**
 * Fetch everything from the local database, and arrange to do so
 * ongoing. Called once when initial replication from remote is done.
 */
function _LeagueDB_start() {
    var that = this;
    function on_change(change) {
        console.log("db start on_change fired", change);
        that.got_db_response(change);
    }
    this.pouch.changes({
        'include_docs': true,
        'live': true,
        'onChange': on_change
    });
}

function _LeagueDB_poke_replication() {
    var that = this;
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
        console.log("complete callback from db replicate.from, arguments", arguments);
        that.controller.report_online("Offline");
        if (err) {
            that.controller.report_error(err.toString());
        } else {
            that.controller.clear_error();
        }
        this.from_replication_up = false;
        // make a button to restart replication?
    }
    function to_complete(err, doc) {
        console.log("complete callback from db replicate.to, arguments", arguments);
        if (err) {
            that.controller.report_error(err.toString());
        } else {
            that.controller.clear_error();
        }
        this.to_replication_up = false;
        // make a button to restart replication?
    }
    this.controller.report_online("Online");
    var r;
    if (this.replicate_bidi && ! this.to_replication_up) {
        r = this.pouch.replicate.to(this.remoteDB, { 'complete': to_complete,
                                                     'live': true });
        console.log("replicate.to started:", r);
        this.to_replication_up = true;
    }
    if ( ! this.from_replication_up) {
        r = this.pouch.replicate.from(this.remoteDB, { 'onChange': onChange,
                                                       'complete': from_complete,
                                                       'live': true });
        console.log("replicate.from started:", r);
        this.from_replication_up = true;
    }
}

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

    if ( ! this.to_replication_up) {
        this.poke_replication();
    }
}

function LeagueDB(pouch, remoteDB, controller, replicate_bidi) {
    this.pouch = pouch;
    this.remoteDB = remoteDB;
    this.controller = controller || new LeagueDBNullController();
    this.replicate_bidi = replicate_bidi;
    this.config = null;
    this.scores = {};
    this.from_replication_up = false;
    this.to_replication_up = false;

    // methods
    this.start = _LeagueDB_start;
    this.got_db_response = _LeagueDB_got_db_response;
    this.new_game_doc = _LeagueDB_new_game_doc;
    this.update_score = _LeagueDB_update_score;
    this.poke_replication = _LeagueDB_poke_replication;

    this.poke_replication();
}

/**
 * Besides a fallback, this documents the controller's DB-facing API. Pretty simple.
 */
function LeagueDBNullController() {
    do_notification = function() {
        console.log("NullController installed - notification, umm, noted.");
    };
    report_online = function(errstr) {
        console.log("NullController installed - error report, umm, noted. (", errstr, ")");
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
