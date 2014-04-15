function _ScoringView_redraw() {
    var w = this.canvas.width;
    var wl = w/3 * 2;
    var wr = w/3;
    var h = this.canvas.height;
    var armed_text, score_text;
    var ctx = this.CBC = this.canvas.getContext("2d");

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 18pt sans-serif";
    if (!ctx.setLineDash) {
        ctx.setLineDash = function () {};
    }

    if (!this.game_key) {
        ctx.fillText("Pick your game.", w/2, h/2-20);
        ctx.fillText("(To score it.)", w/2, h/2+20);
        ctx = this.CBC = null;
        return;
    }

    var gamedoc;
    console.log("redraw hunting key", this.game_key);
    if (this.game_key in this.scores) {
        gamedoc = this.scores[this.game_key];
        console.log("got gamedoc", gamedoc);
    } else {
        console.log("gamedoc is not in this.scores, making a new one. BE SURE REPLICATION IS COMPLETE AND SCORES LOADED BEFORE ALLOWING SCORING GAME SELECTION! Else this .new_game_doc call will generate a conflict.");
        // fake a 0,0 doc.
        this.scores[this.game_key] = gamedoc = this.controller.model.new_game_doc(this.game_key);
        console.log("redraw faked a new gamedoc", gamedoc);
    }
    var team0 = gamedoc.team[0].color,
        team1 = gamedoc.team[1].color;
        
    ctx.fillStyle = team0;
    ctx.fillRect(0, 0, wl, h/2);
    ctx.fillStyle = team1;
    ctx.fillRect(0, h/2, wl, h/2);

    if (this.armed) {
        ctx.fillStyle = "red";
        armed_text = "ARMED";
    } else {
        ctx.fillStyle = "brown";
        armed_text = "(arm)";
    }
    ctx.fillRect(wl, 0, wr, h);
    ctx.fillStyle = "white";
    ctx.save();
    ctx.translate(wl+(wr/2), h/2);
    ctx.rotate(Math.PI/2);
    ctx.fillText(armed_text, 0, 0);
    ctx.restore();

    ctx.fillStyle = this.config.TeamContrast[team0];
    ctx.font = "bold 24pt sans-serif";
    ctx.fillText("-", wl/4, h/4);
    ctx.fillText(gamedoc.score[0], wl/2, h/4);
    ctx.fillText("+", 3*(wl/4), h/4);

    ctx.fillStyle = this.config.TeamContrast[team1];
    ctx.font = "bold 24pt sans-serif";
    ctx.fillText("-", wl/4, 3*(h/4));
    ctx.fillText(gamedoc.score[1], wl/2, 3*(h/4));
    ctx.fillText("+", 3*(wl/4), 3*(h/4));

    ctx = this.CBC = null;
}

function _ScoringView_notifyee_config(cfg) {
    console.log("PP notifyee cfg:", cfg);
    this.config = cfg;
    this.redraw(); 
}

function _ScoringView_notifyee_scores(scores) {
    console.log("_ScoringView_notifyee_scores", scores);
    console.log("game_key still:", this.game_key);
    this.scores = scores;
    this.redraw();
}

/**
 * arg is round_team0_team1 DB id for a game, or null to reset.
 */
function _ScoringView_notifyee_game(game_key) {
    console.log("_ScoringView_notifyee_game", game_key);
    if (game_key) {
        var round, team0, team1;
        var parts = game_key.split("_");
        round = parts[0];
        team0 = parts[1];
        team1 = parts[2];
        this.game_key = game_key;
        this.armed = false;
        this.canvas.style.display = "block";
        this.redraw();
    } else {
        this.canvas.style.display = "none";
    }
}

function _ScoringView_handle_click(e) {
    e = e || window.event;
    e.preventDefault = true;
    var target = e.target || e.srcElement;
    var rect = target.getBoundingClientRect();
    var offsetX = e.clientX - rect.left;
    var offsetY = e.clientY - rect.top;
    console.log(offsetX, offsetY, e);
    var row_height = this.canvas.height / 2;
    var col_width = this.canvas.width / 3;
    var row = Math.floor(offsetY / row_height);
    var col = Math.floor(offsetX / col_width);
    var gamedoc;

    if (this.game_key) {
        try {
            gamedoc = this.scores[this.game_key];
        } catch(err) {
            gamedoc = this.controller.model.new_game_doc(this.game_key);
        }
    } else {
        return;  // TBD
    }
    console.log(row, col);
    if (col === 2) {
        if (this.armed) {
            this.armed = false;
            this.redraw();
        } else {
            this.armed = true;
            this.redraw();
        }
    } else if (this.armed) {
        var incr = 1;
        if (col === 0) {
            incr = -1;
            if (gamedoc.score[row] === 0) {
                console.log("Don't take score below zero.");
                return;
            }
        }
        console.log("update_score", this.game_key, row, incr);
        gamedoc.score[row] += incr;
        this.controller.model.update_score(gamedoc);
        this.armed = false;
        this.redraw();
    }
}

function ScoringView(canvas, controller) {
    this.canvas = canvas;
    this.controller = controller || new ScoringViewNullController();
    this.layout = null;  // instantiated when config is known
    this.scores = {};    ////////////////////////////////  TBD
    this.game_key = null;
    //this.canvas.style.display = "none";
    this.canvas.style.display = "block";

    // methods
    this.redraw = _ScoringView_redraw;
    this.handle_click = _ScoringView_handle_click;
    this.notifyee_config = _ScoringView_notifyee_config;
    this.notifyee_scores = _ScoringView_notifyee_scores;
    this.notifyee_game = _ScoringView_notifyee_game;

    var that = this;
    function onclick(e) {
        that.handle_click(e);
    }
    this.canvas.onclick = onclick;

    this.redraw();
}

/**
 * Besides a fallback, this documents what this module expects of the controller. Pretty simple.
 */
function ScoringViewNullController() {
    function report_error(errstr) {
        console.log("NullController installed - error report, umm, noted. (", errstr, ")");
    }
}
