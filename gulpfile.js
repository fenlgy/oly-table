var gulp        = require('gulp');
var browserSync = require('browser-sync').create();
var reload = browserSync.reload;

const less = require('gulp-less')
//当发生异常时提示错误 确保本地安装gulp-notify和gulp-plumber
const notify = require('gulp-notify')
const  plumber = require('gulp-plumber')
const sourcemaps = require('gulp-sourcemaps')
const LessAutoprefix  = require('less-plugin-autoprefix')
const autoprefix = new LessAutoprefix({ browsers: ['last 2 versions','ie >= 8'] });
const babel = require('gulp-babel')
const jshint = require('gulp-jshint')

gulp.task('parseLess', function () {
    return gulp.src('src/style/*.less')
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(sourcemaps.init())
        .pipe(less({
            plugins: [autoprefix]
        }))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('demo/style'))
        .pipe(browserSync.stream());
});

gulp.task('parseJs', function () {
    return gulp.src('src/**/*.js')
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(sourcemaps.init())
        .pipe(babel())
        // .pipe(concat('all.js'))
        .pipe(sourcemaps.write('./maps'))
        .pipe(gulp.dest('demo/js'));
});

gulp.task('jshint', function() {
    var globs = [
        'src/**/*.js', 'test/test.*.js', 'gulpfile.js', '!**/regexp/parser.js'
    ]
    return gulp.src(globs)
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('jshint-stylish'))
})

// 静态服务器
gulp.task('server', function() {
    browserSync.init({
        server: {
            index:'index.html',
            // directory: true,
            baseDir:["./demo",'./src'],
            // routes: {
            //     "/": "src"
            // }
        },
        injectChanges: true,
    });
    gulp.watch('./demo/*.html',reload);
    gulp.watch('./src/*.js',['parseJs']);
    gulp.watch('./demo/**/*.js',reload);
    gulp.watch('src/**/*.less', ['parseLess']);
    // gulp.watch('demo/**/*.css', reload);
});
