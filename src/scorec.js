function _ScoreController_report_online(msg, up) {
    var n = "online_down";
    var e;
    if (up) {
        n = "online_up";
    }
    e = document.getElementById(n);
    if (e) {
        e.class = msg;
        e.innerText = msg;
    }
}

function _ScoreController_report_error(msg) {
    var e = document.getElementById("error_report");
    if (e) {
        e.class = "error";
        e.innerHTML = msg;
    }
}

function _ScoreController_clear_error() {
    var e = document.getElementById("error_report");
    if (e) {
        e.class = "clear";
        e.innerHTML = '';
    }
}

function _ScoreController_begin_here(model) {
    this.model = model;
    this.model.start();         // local change feed listener drives all else
}

function ScoreController() {
    this.views = [ new NullView(), ];

    // methods
    this.begin_here = _ScoreController_begin_here;
    this.report_online = _ScoreController_report_online;
    this.report_error = _ScoreController_report_error;
    this.clear_error = _ScoreController_clear_error;
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
    this.notify_user = function(user) {
        this.user = user;
    };
}

/**
 * Document ScoreController's expectations regarding views.
 */
function NullView() {
    this.isNullView = true;
    this.boil_config = function(cfg) { return cfg; };
    this.notifyee_config = function(cfg) {};
    this.notifyee_scores = function(scores) {};
}
