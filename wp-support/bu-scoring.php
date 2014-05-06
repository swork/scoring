<?php
/*
Plugin Name: bu-scoring
Description: Support for league scoring panels: [schedule_canvas id="schedule" width="400" height="220" class="scoring_panels"]
Version: 0.2
Author: Steve Work <steve@work.renlabs.com>
License: GPL
*/

/* Make .zip containing just this file, name it "bu-scoring" like this file,
   and Wordpress will consider it a valid plugin to upload manually.
*/

function schedule_canvas_shortcode( $atts, $content = null ) {
	extract( shortcode_atts( array(
                                       'id' => 'schedule_canvas',
                                       'width' => '400',
                                       'height' => '220',
                                       'class' => 'scoring_panels',
	), $atts ) );

	return '<canvas class="' . $atts['class'] . '" id="' . $atts['id'] . '" width="' . $atts['width'] . '" height="' . $atts['height'] . '"><p>Schedule panel is not available to web browsers that cannot handle the HTML5 "canvas" tag - like, apparently, this one.</p></canvas>';
}
add_shortcode('schedule_canvas', 'schedule_canvas_shortcode');

function add_onload() {
  ?>
  <script type="text/javascript">
    if (typeof(run_bu_scoring) !== "undefined") {
      my_onload_callback = function() { run_bu_scoring(); };

      if( typeof jQuery == "function" ) { 
        jQuery(my_onload_callback);
      } else {
        document.getElementsByTagName('body')[0].onload = my_onload_callback;
      }
    }
  </script>
  <?php
}
add_action( 'wp_footer', 'add_onload' );

?>
