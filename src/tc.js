app_trace = function () { console.log.apply(console, arguments); };

function _TestVC_report_online(msg) {
    var e = document.getElementById("online");
    if (e) {
        e.class = msg;
        e.innerHTML = msg;
    }
}

function _TestVC_report_error(msg) {
    var e = document.getElementById("error_report");
    if (e) {
        e.class = "error";
        e.innerHTML += '<p>' + msg + '</p>';
    }
}

function _TestVC_clear_error() {
    var e = document.getElementById("error_report");
    console.log("clear_error, e:", e);
    if (e) {
        e.class = "clear";
        e.innerHTML += '<p>(clear)</p>';
    }
}

function _TestVC_begin_here(model) {
    this.model = model;
    this.model.start();
}

function TestVC() {
    this.views = [ new NullView(), ];

    // methods
    this.begin_here = _TestVC_begin_here;
    this.report_online = _TestVC_report_online;
    this.report_error = _TestVC_report_error;
    this.clear_error = _TestVC_clear_error;
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
        var e = document.getElementById('log');
        e.innerHtml += scores;
    };
}

/**
 * Document TestVC's expectations regarding views.
 */
function NullView() {
    this.isNullView = true;
    this.boil_config = function(cfg) { return cfg; };
    this.notifyee_config = function(cfg) {};
    this.notifyee_scores = function(scores) {};
}
