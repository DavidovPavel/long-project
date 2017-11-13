
define('widget.reportView', ['i18n!nls/resources.min', 'PDFJS' ], function (Resources) {

    return Mn.View.extend({

        template: false,

        modelEvents: {
          
            change: function () {
                this.$el.empty();
                this.renderPage(this.pdf);
            }

        },

        onRender: function () {

            if (!this.options.url)
                this.$el.html('<p>' + Resources.setreport + '</p>');

        },

        onAttach: function () {

            if ( this.options.url )
                require( [
                    "/js/dist/pdf/display/api.js",
                    "/js/dist/pdf/display/metadata.js",
                    "/js/dist/pdf/display/canvas.js",
                    "/js/dist/pdf/display/webgl.js",
                    "/js/dist/pdf/display/pattern_helper.js",
                    "/js/dist/pdf/display/font_loader.js",
                    "/js/dist/pdf/display/annotation_helper.js"
                ],
                    function () {

                        PDFJS.workerSrc = '/js/dist/pdf/worker_loader.js';

                        PDFJS.getDocument( this.options.url ).then( function ( pdf ) {
                            this.pdf = pdf;
                            this.renderPage( pdf );
                        }.bind( this ) );

                    }.bind( this ) );

        },

        renderPage: function (pdf) {

            var viewer = this.$el.get(0),
                width = this.$el.width() - 40;

            function renderPage(div, pdf, pageNumber, callback) {

                pdf.getPage(pageNumber).then(function (page) {

                    var scale = 1.0;
                    var viewport = page.getViewport(scale);

                    viewport = page.getViewport(width / viewport.width);

                    var pageDisplayWidth = viewport.width;
                    var pageDisplayHeight = viewport.height;

                    var pageDivHolder = document.createElement('div');
                    pageDivHolder.className = 'pdfpage';
                    pageDivHolder.style.width = (pageDisplayWidth + 5) + 'px';
                    pageDivHolder.style.height = (pageDisplayHeight + 5) + 'px';
                    div.appendChild(pageDivHolder);

                    // Prepare canvas using PDF page dimensions
                    var canvas = document.createElement('canvas');
                    var context = canvas.getContext('2d');
                    canvas.width = pageDisplayWidth;
                    canvas.height = pageDisplayHeight;
                    pageDivHolder.appendChild(canvas);

                    // Render PDF page into canvas context
                    var renderContext = {
                        canvasContext: context,
                        viewport: viewport
                    };
                    page.render(renderContext).promise.then(callback);

                });
            }

            var pageNumber = 1;
            renderPage(viewer, pdf, pageNumber++, function pageRenderingComplete() {
                if (pageNumber > pdf.numPages)
                    return; // All pages rendered 
                renderPage(viewer, pdf, pageNumber++, pageRenderingComplete);
            });

        },

        fitSize: function () {

        }
    });

});