(function( $ ) {
	
	var gtkDefs = {
		mode            : null,
		min			: 0,
	    max			: 100,
	    val			: 33,
	    colorMain   : '#b0d2c8',
	    colorFiller : '#3bb54c',
	    colorStick  : '#3bb54c',
	    rotateFrom  : 0,
	    rotateTo    : 166,
	    rotateFrom1 : 7.3,
	    rotateTo1   : 172.7,
	    anim        : 'all 1s'
	};
	
	
	
	$.fn.gtkMeter = function(options) {
		
		var opts = $.extend( {}, gtkDefs, options );
		
		return this.each(function() {
			var min = $(this).data('meter-min'),
    	    	max = $(this).data('meter-max'),
    	    	val = $(this).data('meter-val');
    	    
    	    if ( min == undefined || min == '' ) min = opts.min;
    	    if ( max == undefined || max == '' ) max = opts.max;
    	    if ( val == undefined || val == '' ) val = opts.val;
    	    
    	    var metrik = $.fn.gtkMeter.mathmeter(min, max, val, opts);
    	    $.fn.gtkMeter.svg($(this));
    	    $.fn.gtkMeter.stylize($(this), metrik, opts);
	    	
    	});
    	
		return this;        
	}
	
	
	$.fn.gtkMeter.mathmeter = function( min, max, val, opts) {
		
		var r = (val) / (max/100); 
		var p = {};
		p.one = ((opts.rotateTo - opts.rotateFrom)/100) * ( r );
		p.two = ((opts.rotateTo1 - opts.rotateFrom1)/100) * ( r );
		p.two = p.two + 6.6;
		return p;
	}
	
	$.fn.gtkMeter.svg = function( elem ) {
		if ( elem.find('svg.gtk-meter').length > 0 ) {
			return elem;
		} else {
			return elem.append('<svg class="gtk-meter" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 93 41">'
				+ '<path class="gtk-meter-main" d="M46.5,0C20.8,0,0,20.8,0,46.5C0,72.2,20.8,93,46.5,93S93,72.2,93,46.5C93,20.8,72.2,0,46.5,0z M46.5,87C24.1,87,6,68.9,6,46.5C6,24.1,24.1,6,46.5,6S87,24.1,87,46.5C87,68.9,68.9,87,46.5,87z"/>'
				+ '<path class="gtk-meter-filler" style="-webkit-transform: rotate(0deg); -ms-transform: rotate(0deg); transform: rotate(0deg);" d="M40.8,92.7c25.5,3.1,48.7-15,51.8-40.5l-6-0.7c-2.7,22.2-22.9,38-45.1,35.3S3.6,63.8,6.3,41.6l-6-0.7C-2.8,66.3,15.4,89.5,40.8,92.7z"/>'
				+ '<g class="gtk-meter-stick"><rect fill="none" x="46.5" y="46.2" width="41.8" height="0.7"/><polygon points="5.5,46.2 46.5,45.2 46.5,47.9 5.5,46.8 "/></g>'
				+ '</svg>');
		}
	};
	
	$.fn.gtkMeter.stylize = function ( elem, metrik, opts ) {
		var transition = ' -webkit-transition: '+opts.anim+'; -moz-transition: '+opts.anim+'; -o-transition: '+opts.anim+'; transition: '+opts.anim+'; ';
		var transform = ' transform-origin: 51.8% 10.3%; ';
		var transform1 = ' transform-origin: 50% 50%; ';
		var rotate = ' -webkit-transform: rotate('+metrik.one+'deg); -ms-transform: rotate('+metrik.one+'deg); transform: rotate('+metrik.one+'deg); ';
		var rotate1 = ' -webkit-transform: rotate('+ metrik.two + 'deg); -ms-transform: rotate('+metrik.two+'deg); transform: rotate('+metrik.two+'deg); ';
		elem.find('.gtk-meter-main').attr('fill', opts.colorMain);
		elem.find('.gtk-meter-filler').attr('fill', opts.colorFiller).attr('style', transition + transform + rotate);
		elem.find('.gtk-meter-stick').attr('fill', opts.colorStick).attr('style', transition + transform1 + rotate1);
		return elem;
	}
	
	$(function() {
		//$("[data-meter=true]").gtkMeter();
	});
	
})(window.jQuery || window.Zepto);