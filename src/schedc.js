function _SchedController_report_online(msg, up) {
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

function _SchedController_report_error(msg) {
    var e = document.getElementById("error_report");
    if (e) {
        e.class = "error";
        e.innerHTML = msg;
    }
}

function _SchedController_clear_error() {
    var e = document.getElementById("error_report");
    console.log("clear_error, e:", e);
    if (e) {
        e.class = "clear";
        e.innerHTML = '';
    }
}

function _SchedController_begin_here(model) {
    this.model = model;
    this.model.start();
}

function SchedController() {
    this.views = [ new NullView(), ];

    // methods
    this.begin_here = _SchedController_begin_here;
    this.report_online = _SchedController_report_online;
    this.report_error = _SchedController_report_error;
    this.clear_error = _SchedController_clear_error;
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
            cfg = this.views[i].boil_config(cfg);
        }
        return cfg;
    };
    this.notify_config = function(cfg) {
        for (var i=0; i<this.views.length; ++i) {
            this.views[i].notifyee_config(cfg);
        }
    };
    this.notify_scores = function(scores) {
        for (var i=0; i<this.views.length; ++i) {
            this.views[i].notifyee_scores(scores);
        }
    };
}

/**
 * Document SchedController's expectations regarding views.
 */
function NullView() {
    this.isNullView = true;
    this.boil_config = function(cfg) { return cfg; };
    this.notifyee_config = function(cfg) {};
    this.notifyee_scores = function(scores) {};
}
