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

/*
function redraw_everything() {
    clear_error();
    console.log("redraw for initial sync, _pool_canvas_handler:", _pool_canvas_handler);
    _pool_canvas_handler.start();
};

function go_live() {
    console.log("go_live");
    var e = document.getElementById("online");
    if (e) {
        e.innerHTML="Replication finished.";
    }
    redraw_everything();
}

function pp_clicked(e) {
    _pool_canvas_handler.handle_click(e);
}
*/

function _AppController_begin_here(model) {
    this.model = model;
    this.model.start();
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
 * Document AppController's expectations regarding views.
 */
function NullView() {
    this.isNullView = true;
    this.boil_config = function(cfg) { return cfg; };
    this.notifyee_config = function(cfg) {};
    this.notifyee_scores = function(scores) {};
}
