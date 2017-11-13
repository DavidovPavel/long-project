define('g/files/UploadFileView', ['i18n!nls/resources.min'], function (Resources) {

    var FileModel = Backbone.Model.extend({
        idAttribute: "FileUID",
        defaults: {
            FileUID: null,
            FilePath: '',
            CDate: new Date().toISOString(),
            FileName: '',
            FileUrl: ''
        }
    });

    return Mn.View.extend({
        
        className: 'image-path',

        template: '#file-upload-template',
        templateContext: {
            Resources: Resources
        },

        ui: {
            form: 'form',
            file: 'input[name = fileToUpload]',
            pro: '.progress',
            bar: '.bar',
            per: '.percent'
        },

        events: {

            "change @ui.file": function (e) {

                var v = this.ui.file.val();
                this.ui.file.prev('.input').text(v);

                if ($.trim(v)) {

                    var segm = this.ui.file.val().split("\\"),
                        name = segm[segm.length - 1],      
                        po = name.split('.'),
                        ex = this.collection.find(function (a) { return a.get('OriginalFileName').indexOf(name) !== -1 });

                    //var ext = ['gif', 'jpeg', 'jpg', 'png', 'bmp'];

                    //if (ext.indexOf(po[po.length - 1].toLowerCase()) === -1) {
                    //    this.$(".anbr-tooltip").html('<span position="bottom"></span>' + Resources.error + ' Invalid extension of file.');
                    //    ex = 1;
                    //}

                    if ( !ex )
                        this.ui.form.submit();
                    else
                        this.$( ".anbr-tooltip" ).show().delay( 5000 ).fadeOut();
                }
            }
        },

        initialize: function () {

            this.formAction = this.options.formAction || "/api/common/upload/";
            

        },

        indicator: function (v) {

            this.ui.pro.show();
            this.ui.bar.width(v)
            this.ui.per.html(v).show();

        },

        onRender: function () {

            this.ui.form.attr("action", this.formAction);
            this.ui.bar.width(0);
            this.ui.per.html("0%");
            this.ui.file.val('');

            this.ui.form.ajaxForm({

                beforeSend: function () {
                    this.indicator('0%');                   
                }.bind(this),

                uploadProgress: function (event, position, total, percentComplete) {
                    this.indicator(percentComplete + '%');
                }.bind(this),

                success: function () {
                    this.indicator('100%');
                }.bind(this),

                error: function () {
                    this.$(".anbr-tooltip").html('<span position="bottom"></span>' + Resources.error + ' Server errror.').show().delay(5000).fadeOut();
                    this.onFinal();
                }.bind(this),

                complete: function (xhr) {

                    _.map(xhr.responseJSON, function (path) {

                        if ( path.indexOf( 'error' ) !== -1 ) {
                            this.$( ".anbr-tooltip" ).html( '<span position="bottom"></span>' + path.replace( 'error', '' ) ).show().delay( 5000 ).fadeOut();
                            this.onFinal();
                            return;
                        }

                        if(path.Message){
                            this.$(".anbr-tooltip").html('<span position="bottom"></span>' + path.Message).show().delay(5000).fadeOut();
                            this.onFinal();
                            return;
                        }

                        var segm = path.split("\/"),
                            last = segm[segm.length - 1],
                            name = last.substr(last.indexOf('_') + 1),
                            fuid = last.split("_")[0];

                        var model = new FileModel( {
                            FileUID: fuid,
                            FilePath: path,
                            FileUrl: path,
                            FileName: name,
                            OriginalFileName: name
                        });

                        this.collection.add(model);

                    }, this);

                    this.ui.file.val('');
                    this.$(".input").text(Resources.selFile);

                    this.onFinal();

                }.bind(this)
            });

        },

        onFinal: function () {
            setTimeout(function () {
                this.ui.bar.width(0);
                this.ui.per.html("0%");
                this.ui.pro.hide();
            }.bind(this), 1000);
        }

    });
});