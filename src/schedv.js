Months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function reformatDate(dateString) {
    var d = new Date(dateString);
    return Months[d.getMonth()] + d.getDate();
}

function dotAt(ctx, cx, cy) {
    ctx.save();
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    ctx.moveTo(cx, cy);
    ctx.beginPath();
    ctx.arc(cx, cy, 1, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === "undefined" ) {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (stroke) {
        ctx.stroke();
    }
    if (fill) {
        ctx.fill();
    }        
}

function trace_half_box(ctx, x, y, w, h, m) {
    var r = 7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + m * (h - r));
    ctx.quadraticCurveTo(x + w, y + m * h, x + w - r, y + m * h);
    ctx.lineTo(x + r, y + m * h);
    ctx.quadraticCurveTo(x, y + m * h, x, y + m * (h - r));
    ctx.closePath();
}

/////////////////////////////////

function _ScheduleView_create_matchup_box(cx, cy, w, h, dateString, matchupIdx) {
    var ctx = this.CBC;
    var TOP = 0;
    var BOTTOM = 1;
    var x = cx - (w / 2.0);
    var y = cy - (h / 2.0);
    var r = 7;
    var matchup = this.config.PoolMatches[dateString][matchupIdx];
    var topScore, botScore;
    var datekey = reformatDate(dateString);
    var scorekey = datekey + "_" + matchup[TOP] + "_" + matchup[BOTTOM];

    try {
        topScore = this.scores[scorekey].score[TOP];
    } catch(err) {
        topScore = undefined;
    }
    try {
        botScore = this.scores[scorekey].score[BOTTOM];
    } catch(err) {
        botScore = undefined;
    }

    ctx.strokeStyle = "black";
    ctx.strokeWidth = 1;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;
    if (topScore !== undefined && botScore !== undefined && topScore !== botScore) {
        if (topScore > botScore) {
            // flat bottom
            trace_half_box(ctx, x, cy, w, h/2, 1);
            ctx.fillStyle = matchup[BOTTOM];
            ctx.stroke();
            ctx.fill();
            ctx.fillStyle = this.config.TeamContrast[matchup[BOTTOM]];
            ctx.fillText("" + botScore, cx, cy + h/4);
            // pop top
            ctx.save();
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 1;
            trace_half_box(ctx, x-1, cy-1, w, h/2, -1);
            ctx.fillStyle = matchup[TOP];
            ctx.stroke();
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.config.TeamContrast[matchup[TOP]];
            ctx.fillText("" + topScore, cx, cy - h/4);
        } else {
            // flat top
            trace_half_box(ctx, x, cy, w, h/2, -1);
            ctx.fillStyle = matchup[TOP];
            ctx.stroke();
            ctx.fill();
            ctx.fillStyle = this.config.TeamContrast[matchup[TOP]];
            ctx.fillText("" + topScore, cx, cy - h/4);
            // pop bottom
            ctx.save();
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.shadowBlur = 1;
            trace_half_box(ctx, x-1, cy-1, w, h/2, 1);
            ctx.fillStyle = matchup[BOTTOM];
            ctx.stroke();
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = this.config.TeamContrast[matchup[BOTTOM]];
            ctx.fillText("" + botScore, cx, cy + h/4);
        }
    } else {
        // both flat
        trace_half_box(ctx, x, cy, w, h/2, -1);
        ctx.fillStyle = matchup[TOP];
        ctx.stroke();
        ctx.fill();
        if (topScore !== undefined) {
            ctx.fillStyle = this.config.TeamContrast[matchup[TOP]];
            ctx.fillText("" + topScore, cx, cy - h/4);
        }
        trace_half_box(ctx, x, cy, w, h/2, 1);
        ctx.fillStyle = matchup[BOTTOM];
        ctx.stroke();
        ctx.fill();
        if (botScore !== undefined) {
            ctx.fillStyle = this.config.TeamContrast[matchup[BOTTOM]];
            ctx.fillText("" + botScore, cx, cy + h/4);
        }
    }
}

function _ScheduleView_create_column_header(dateString, columnCenter) {
    var display_date = reformatDate(dateString);
    this.CBC.save();
    this.CBC.shadowBlur = 1;
    this.CBC.shadowOffsetX = 2;
    this.CBC.shadowOffsetY = 2;
    this.CBC.font = "bold " + this.layout.TextSizeHeader + "pt sans-serif";

    var box_width = this.CBC.measureText(display_date + " ").width;
    //console.log("box_width", box_width, "font", this.CBC.font);
    var bgBoxX = columnCenter - (box_width / 2.0);
    var bgBoxY = this.layout.DateHeaderCY - (this.layout.DateHeaderHeight / 2.0);
    this.CBC.fillStyle = "white";
    this.CBC.strokeStyle = "black";
    this.CBC.strokeWidth = 1;
    //console.log("rr:", bgBoxX, bgBoxY, box_width, this.layout.DateHeaderHeight, 7, true, true);
    roundRect(this.CBC, bgBoxX, bgBoxY, box_width, this.layout.DateHeaderHeight, 7, true, true);
    this.CBC.fillStyle = "black";
    this.CBC.shadowBlur = 0;
    this.CBC.shadowOffsetX = 0;
    this.CBC.shadowOffsetY = 0;
    this.CBC.fillText(display_date, columnCenter, this.layout.DateHeaderCY);
    this.CBC.restore();
}

function _ScheduleView_create_column_content(dateString, columnCenter) {
    this.create_column_header(dateString, columnCenter);

    var n_matches = this.config.PoolMatches[dateString].length;
    var w = this.layout.MatchupBoxWidth;
    var h = this.layout.MatchupBoxHeight;
    var j;
    for (j=0; j < n_matches; ++j) {
        var y = this.layout.MatchupBoxTopCY + (j * this.layout.MatchupBoxSpacingY);
        this.create_matchup_box(columnCenter, y, w, h, dateString, j);
    }
}

function _ScheduleView_draw_columns() {
    var column_width = this.canvas.width / this.config.Dates.length;
    var date_objs_sorted = this.config.Dates;

    var i;
    for (i=0; i<date_objs_sorted.length; ++i) {
        var columnCenter = (i * column_width) + (0.5 * column_width);
        this.create_column_content(date_objs_sorted[i][1 /* str */], columnCenter);
    }
}

function _ScheduleView_draw_date_line(today) {
    var column_width = this.canvas.width / this.config.Dates.length;
    // dotted vertical line between played and not-yet, plus gray to R
    // of line
    var i;
    var ctx = this.CBC;

    for (i=0; i<this.config.Dates.length; ++i) {
        var date_val = this.config.Dates[i][0 /* Date.valueOf() */ ];
        if (today.valueOf() < date_val) {
            break;
        }
    }
    if (i > 0 && i < this.config.Dates.length) {
        var left = i * column_width;
        var dash = this.canvas.height / 19;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(left, 0);
        ctx.lineTo(left, this.canvas.height);
        ctx.strokeWidth = 4;
        ctx.setLineDash([dash, dash]);
        ctx.strokeStyle = "black";
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.globalAlpha = 0.2;
        ctx.fillRect(left, 0, this.canvas.width - left, this.canvas.height);
        ctx.restore();
    }
}

function _ScheduleView_redraw() {
    var emWidth;
    var lineHeight;
    var d;

    if ('today_for_testing' in this.config && this.config.today_for_testing) {
        d = new Date(this.config.today_for_testing);
    } else {
        d = new Date();
    }

    emWidth = this.canvas.width / (7.0 * this.config.Dates.length);
    lineHeight = emWidth * 2;
    // console.log("em width:", emWidth, " line height:", lineHeight);

    var mbw = (emWidth * 7) * 0.80;
    var mbh = mbw * 0.9;
    var dhh = emWidth * 2.5;
    var dhcy = dhh;
    /* measure text for date header width */
    this.layout = {
        'TextSizeHeader':     10,
        'TextSizeScores':     12,
        'DateHeaderCY':       Math.floor(dhcy),
        'DateHeaderHeight':   Math.floor(dhh),
        'MatchupBoxWidth':    Math.floor(mbw),
        'MatchupBoxHeight':   Math.floor(mbh),
        'MatchupBoxSpacingY': Math.floor(mbh * 1.25),
        'MatchupBoxTopCY':    Math.floor(dhh + dhcy + (mbh / 2.0))
    };

    this.canvas.height = Math.floor(this.layout.MatchupBoxTopCY - (this.layout.MatchupBoxHeight / 2) + (this.config.MaxMatchesPerDate * this.layout.MatchupBoxSpacingY) * 1.02);

    this.CBC = this.canvas.getContext("2d");
    this.CBC.shadowColor = "black";
    this.CBC.fillStyle = "black";
    this.CBC.textAlign = "center";
    this.CBC.textBaseline = "middle";
    this.CBC.font = "bold 12pt sans-serif";
    if (!this.CBC.setLineDash) {
        this.CBC.setLineDash = function () {};
    }

    this.CBC.save();
    this.CBC.fillStyle = "#FAEBD7";
    this.CBC.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.CBC.restore();

    this.CBC.save();
    this.CBC.translate(0.5, 0.5);
    this.draw_columns(this.layout);
    this.CBC.restore();

    this.draw_date_line(d);
    
    // free mem until next drawing operation
    this.CBC = null;
}

function _ScheduleView_notifyee_config(cfg) {
    console.log("PP notifyee cfg:", cfg);
    this.config = cfg;
    this.redraw(); 
}

function _ScheduleView_notifyee_scores(scores) {
    this.scores = scores;
    this.redraw();
}

function _ScheduleView_boil_config(cfg) {
    var m = cfg.PoolMatches;
    var datestrings = Object.keys(m);
    cfg.Dates = datestrings.map(function(s) {
        var o = new Date(s); return [o.valueOf(), s, o];
    }).sort();

    var max_matches = 0;
    for (var d in m) {
        var l = m[d].length;
        if (l > max_matches) {
            max_matches = l;
        }
    }
    cfg.MaxMatchesPerDate = max_matches;

    return cfg;
}

function _ScheduleView_handle_click(e) {
    e = e || window.event;
    e.preventDefault = true;
    var target = e.target || e.srcElement;
    var rect = target.getBoundingClientRect();
    var offsetX = e.clientX - rect.left;
    var offsetY = e.clientY - rect.top;
    console.log(offsetX, offsetY, e);
    if (this.layout && this.config) {
        var column_width = this.canvas.width / this.config.Dates.length;
        var column_offset = 0;
        var row_height = this.layout.MatchupBoxSpacingY;
        var row_offset = this.layout.MatchupBoxTopCY - (row_height / 2);
        var col = Math.floor((offsetX - column_offset) / column_width);
        var row = Math.floor((offsetY - row_offset) / row_height);
        console.log("game row:", row, " col:", col);
        var round = this.config.Dates[col][1]; // long-form string
        var game = this.config.PoolMatches[round][row];
        var game_key = reformatDate(round) + "_" + game[0] + "_" + game[1];
        if ('notify_game' in this.controller) {
            console.log("Notifying game selected:", game_key);
            this.controller.notify_game(game_key);
        }
    }
}

function ScheduleView(canvas, controller) {
    this.canvas = canvas;
    this.controller = controller || new ScheduleViewNullController();
    this.layout = null;  // instantiated when config is known
    this.scores = null;

    // methods
    this.boil_config = _ScheduleView_boil_config;
    this.redraw = _ScheduleView_redraw;
    this.draw_columns = _ScheduleView_draw_columns;
    this.create_column_content = _ScheduleView_create_column_content;
    this.create_column_header = _ScheduleView_create_column_header;
    this.create_matchup_box = _ScheduleView_create_matchup_box;
    this.draw_date_line = _ScheduleView_draw_date_line;
    this.handle_click = _ScheduleView_handle_click;
    this.notifyee_config = _ScheduleView_notifyee_config;
    this.notifyee_scores = _ScheduleView_notifyee_scores;

    var that = this;
    function onclick(e) {
        that.handle_click(e);
    }
    this.canvas.onclick = onclick;
}

/**
 * Besides a fallback, this documents what this module expects of the controller. Pretty simple.
 */
function ScheduleViewNullController() {
    function report_error(errstr) {
        console.log("NullController installed - error report, umm, noted. (", errstr, ")");
    }
}
