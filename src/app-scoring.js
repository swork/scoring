app_trace = function () { console.log.apply(console, arguments); };

function _AppController_report_online(msg) {
    var e = document.getElementById("online");
    if (e) {
        e.class = msg;
        e.innerHTML = msg;
    }
}

function _AppController_report_error(msg) {
    var e = document.getElementById("error_report");
    if (e) {
        e.class = "error";
        e.innerHTML = msg;
    }
}

function _AppController_clear_error() {
    var e = document.getElementById("error_report");
    console.log("clear_error, e:", e);
    if (e) {
        e.class = "clear";
        e.innerHTML = '';
    }
}

function _AppController_begin_here(model) {
    this.model = model;
    this.model.start();         // local change feed listener drives all else
}

function AppController() {
    this.views = [ new NullView(), ];

    // methods
    this.begin_here = _AppController_begin_here;
    this.report_online = _AppController_report_online;
    this.report_error = _AppController_report_error;
    this.clear_error = _AppController_clear_error;
    this.addView = function(view) {
        if (this.views.length === 1 && this.views[0].isNullView) {
            this.views = [ view ];
        } else {
            this.views.push(view);
        }
    };
    this.setModel = function(model) {
        this.model = model;
    };
    this.boil_config = function(cfg) {
        for (var i=0; i<this.views.length; ++i) {
            var v = this.views[i];
            if ('boil_config' in v) {
                cfg = v.boil_config(cfg);
            }
        }
        return cfg;
    };
    this.notify_config = function(cfg) {
        for (var i=0; i<this.views.length; ++i) {
            var v = this.views[i];
            if ('notifyee_config' in v) {
                v.notifyee_config(cfg);
            }
        }
    };
    this.notify_scores = function(scores) {
        for (var i=0; i<this.views.length; ++i) {
            var v = this.views[i];
            if ('notifyee_scores' in v) {
                v.notifyee_scores(scores);
            }
        }
    };
    this.notify_game = function(game_key) {
        for (var i=0; i<this.views.length; ++i) {
            var v = this.views[i];
            if ('notifyee_game' in v) {
                v.notifyee_game(game_key);
            }
        }
    };
}

/**
 * Document AppController's expectations regarding views.
 */
function NullView() {
    this.isNullView = true;
    this.boil_config = function(cfg) { return cfg; };
    this.notifyee_config = function(cfg) {};
    this.notifyee_scores = function(scores) {};
}

