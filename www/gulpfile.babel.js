/// <binding BeforeBuild='production' />
"use strict";

import del from 'del';
import gulpIf from 'gulp-if';
import path from "path";
import gulp from 'gulp';
import babel from 'gulp-babel';
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import gulpless from "gulp-less";
import notify from "gulp-notify";
import rename from 'gulp-rename';
import sourcemaps from "gulp-sourcemaps";
import htmlmin from "gulp-htmlmin";        
import debug from "gulp-debug";    
import cleanCss from "gulp-clean-css";
import html2tpl from "gulp-html2tpl";

const app = ['main', 'login', 'wall', 'inquiry', 'seasources', 'reqlibrary'];

const paths = function(mod) {

    return {

        html:{
            src: `js/@${mod}/**/*.html`,
            dest: `Areas/${mod}/Views/Shared/TemplateUnderscore.cshtml`
        },

        tpl:{
            src: `js/@${mod}/**/*.tpl`,
            dest: `frontend/public/js/${mod}`
        },

        less: {
            src: `frontend/less/${mod}.less`,
            dest: 'frontend/public/css/'
        },

        js:  {
            src: `js/@${mod}/**/*.js`,
            dest: `frontend/public/js/${mod}`
        }
    };
};

const clean_all = () => del(['frontend/public/js/','frontend/public/css/' ]);

const inline = () => 
    gulp.src([
        "js/entry.js",
        "js/nls/resources.js",
        "js/nls/en-us/resources.js",
        "js/nls/ej.localetexts.ru-RU.js"
    ], { base: "./" })
    .pipe(uglify())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('./'));

const vendor = () =>
    gulp.src( [
         'js/dist/jquery.js',         
         'js/dist/jquery-ui.js',
         'js/dist/jquery.cookie.js',                          
         "js/dist/underscore.js",
         "js/dist/backbone.js",
         "js/dist/backbone.radio.js",
         "js/dist/backbone.marionette.js",
         "js/dist/d3.js",
         'js/dist/paginator3000.js'
    ] )
         .pipe( concat( 'vendor.js' ) )
         .pipe( uglify() )
         .pipe( gulp.dest( 'frontend/public/js' ) );

const global_js = () => {

    const build = require('./js/@global/build.json');

    return gulp.src(build['js'])
        .pipe(babel())
        .pipe(sourcemaps.init())
        .pipe(concat('global.min.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write())        
        .pipe(gulp.dest('frontend/public/js'));

};

const global_html = () => {

    return gulp.src('js/@global/**/*.html', { base: "." })
       .pipe(concat('views/shared/TemplateUnderscoreGlobal.cshtml'))
       .pipe(htmlmin({ collapseWhitespace: true, collapseInlineTagWhitespace: true }))
       .pipe(gulp.dest("."));

};

 export const dossier = ()=> 
    gulp.src('frontend/less/dossier.less')
       .pipe(gulpless())
       //.pipe(cleanCss())
       .pipe(gulp.dest('frontend/public/css'));

function watchFiles(o) {

    let path = paths(o);

    const html = () => {

        const include = require(`./js/@${o}/include.json`);

        let arr = [path.html.src];

        if(include['html'])
            include['html'].map((a)=>arr.push(a));

        return gulp.src(arr)
            .pipe(concat(path.html.dest))
            .pipe(htmlmin({ collapseWhitespace: true, collapseInlineTagWhitespace: true }))
            .pipe(gulp.dest("."));
    };

    const tpl = ()=>{

        const include = require(`./js/@${o}/include.json`);

        let arr = [path.tpl.src];

        if(include['tpl'])
            include['tpl'].map((a)=>arr.push(a));

        return gulp.src(arr)
        .pipe(html2tpl('templates.js'))
        .pipe(gulp.dest(path.tpl.dest));
    }

    const js = () => {

        const include = require(`./js/@${o}/include.json`);

        let arr = [path.js.src];
        include['js'].map((a)=>arr.push(a));

        return gulp.src(arr)
          .pipe(babel())
          .pipe(sourcemaps.init())
          .pipe(concat('index.min.js'))
          .pipe(sourcemaps.write())
          .pipe(gulp.dest(path.js.dest));
    };

    const less = () => 
        gulp.src(path.less.src)
            .pipe(sourcemaps.init())
            .pipe(gulpless())
            .on('error', notify.onError())
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest(path.less.dest));


    gulp.watch('frontend/less/**/*.less', less);

    gulp.watch('js/**/*.html', gulp.series( html, global_html));

    gulp.watch('js/**/*.tpl', tpl);

    gulp.watch(['js/**/*.js', '!js/nls'], gulp.series(js, global_js));

}
//export { watchFiles as watch };


const dev = (o, flag)=> {
    
    let path = paths(o),
        isProd = !!flag;

    //console.log(`production - ${isProd}`);

    const less = () => 
        gulp.src(path.less.src)
            .pipe(gulpIf(!isProd, sourcemaps.init()))
            .pipe(gulpless())
            .pipe(gulpIf(isProd, cleanCss()))
            .on('error', notify.onError())
            .pipe(gulpIf(!isProd, sourcemaps.write('.')))
            .pipe(gulp.dest(path.less.dest));

    const js = () => {

        const include = require(`./js/@${o}/include.json`);

        let arr = [path.js.src];
        include['js'].map((a)=>arr.push(a));

        return gulp.src(arr)
          .pipe(babel())
          .pipe(sourcemaps.init())
          .pipe(concat('index.min.js'))
          .pipe(sourcemaps.write())
          .pipe(gulpIf(isProd, uglify()))
          .pipe(gulp.dest(path.js.dest));
    };

    const tpl = ()=>{

        const include = require(`./js/@${o}/include.json`);

        let arr = [path.tpl.src];

        if(include['tpl'])
            include['tpl'].map((a)=>arr.push(a));

        console.log(arr);

        return gulp.src(arr)
        .pipe(html2tpl('templates.js'))
        .pipe(gulp.dest(path.tpl.dest));
    };

    const html = () => {

        const include = require(`./js/@${o}/include.json`);

        let arr = [path.html.src];

        if(include['html'])
            include['html'].map((a)=>arr.push(a));

        return gulp.src(arr)
            .pipe(concat(path.html.dest))
            .pipe(htmlmin({ collapseWhitespace: true, collapseInlineTagWhitespace: true }))
            .pipe(gulp.dest("."));
    };
    
    const clean = () => del([`frontend/public/js/${o}`,`frontend/public/css/${o}.css` ]);

    gulp.series(clean, gulp.parallel( less, js, tpl, html )).call(this);
};

const app_vendor = gulp.series(vendor, inline, global_js, global_html);

const app_build = (c) => {
    app.map((name)=>{ return dev(name, true);});
    c();
};

export const production = gulp.series(clean_all, gulp.parallel(app_vendor, app_build), dossier);


gulp.task('app::dashboard', function(c) { dev('wall'); c(); });
gulp.task('app::inquiry', function(c) { dev('inquiry'); c(); });
gulp.task('app::search-sources', function(c) {dev('seasources'); c();});
gulp.task('app::request-library', function(c) { dev('reqlibrary'); c();});
gulp.task('app::main', function(c) {dev('main'); c();});
gulp.task('app::login', function(c) { dev('login'); c();});

gulp.task('watch:inquiry', function(c) { watchFiles('inquiry'); c();});
gulp.task('watch:dashboard', function(c) { watchFiles('wall'); c();});

//gulp.task('less:dev', function () {

//    return gulp.src('frontend/less/*.less')
//        .pipe(sourcemaps.init())
//        .pipe(gulpless())
//        .on('error', notify.onError())
//        .pipe(sourcemaps.write('.'))
//        .pipe(gulp.dest('frontend/public/css'));

//});

//gulp.task('less:apps', function () {

//    return gulp.src('frontend/less/**/*.less')
//        .pipe(sourcemaps.init())
//        .pipe(gulpless())
//        .on('error', notify.onError())
//        .pipe(sourcemaps.write('.'))
//        .pipe(gulp.dest('frontend/public/css'));

//});

//function lasyRequireTasks(taskName, options) {

//    options = options || {};
//    options.taskName = taskName;

//    let path = './frontend/tasks/' + taskName;

//    gulp.task(taskName, function (callback) {

//        let task = require(path).call(this, options);
//        return task(callback);

//    });
//}


//gulp.task("html", folders(develop, function (folder) {

//    var build = folder.indexOf('@') !== -1 ? require('./js/' + folder + '/build.json') : [];

//    var tasks = getBundles(build, ".html").map(function (bundle) {
//        return gulp.src(bundle.inputFiles, { base: "." })
//           .pipe(concat(bundle.outputFileName))
//           .pipe(htmlmin({ collapseWhitespace: true, collapseInlineTagWhitespace: true }))
//           .pipe(gulp.dest("."));
//    });

//    return merge(tasks);

//}));



//gulp.task('less:prod', function () {

//    return gulp.src('Content/_less/*.less')
//        .pipe(less())
//        .pipe(cleanCss())
//        .pipe(gulp.dest('content/anbr/'));

//});

//gulp.task( 'less:clean', function () {
//    return del( 'content/anbr/*.*' );
//});

//gulp.task('less:watch', function () {
//    gulp.watch('Content/_less/**/*.less', ['less:dev']);
//});

//gulp.task('less:build-clean:dev:watch', ['less:clean', 'less:dev', 'less:watch']);

//gulp.task('less:build-clean:prod', ['less:clean', 'less:prod']);


//gulp.task("js:debug", folders(develop, function (folder) {

//    var build = folder.indexOf('@') !== -1 ? require('./js/' + folder + '/build.json') : [];

//    var tasks = getBundles(build, ".js").map(function (bundle) {
//        return gulp.src(bundle.inputFiles)
//            .pipe(sourcemaps.init())
//            .pipe(concat(bundle.outputFileName))
//            .pipe(sourcemaps.write())
//            .pipe(gulp.dest(path.join(output, "js")));
//    });

//    return merge(tasks);

//}));

//gulp.task("js:production", folders(develop, function (folder) {

//    var build = folder.indexOf('@') !== -1 ? require('./js/' + folder + '/build.json') : [];

//    var tasks = getBundles(build, ".js").map(function (bundle) {
//        return gulp.src(bundle.inputFiles)
//            .pipe(concat(bundle.outputFileName))
//            .pipe(uglify())
//            .pipe(gulp.dest(path.join(output, "js")));
//    });

//    return merge(tasks);
//}));



//gulp.task( "js:vendor", function () {

//    return gulp.src( [
//        'js/dist/jquery.js',
//        'js/dist/jquery-ui.js',
//        'js/dist/jquery.cookie.js',
//        'js/dist/jquery.form.js',                      
//        "js/dist/underscore.js",
//        "js/dist/backbone.js",
//        "js/dist/backbone.radio.js",
//        "js/dist/backbone.marionette.js",
//        "js/dist/d3.js",
//        "js/dist/c3.js",
//        'js/dist/paginator3000.js'
//    ] )
//        .pipe( concat( 'vendor.js' ) )
//        .pipe( uglify() )
//        .pipe( gulp.dest( path.join( output, "js" ) ) );

//});

//gulp.task('js:so', function () {

//    return gulp.src([
//        "js/entry.js",
//        "js/nls/resources.js",
//        "js/nls/en-us/resources.js",
//        "js/nls/ej.localetexts.ru-RU.js"
//    ], { base: "./" })
//    .pipe(uglify())
//    .pipe(rename({ suffix: '.min' }))
//    .pipe(gulp.dest('./'))

//});


//function getBundles(config, extension) {
//    return config.filter(function (bundle) {
//        return new RegExp(extension).test(bundle.outputFileName);
//    });
//}