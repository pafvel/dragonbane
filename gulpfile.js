const gulp = require('gulp');
const less = require('gulp-less');

gulp.task('less', function (cb) {
    gulp
        .src('less/dragonbane.less')
        .pipe(less())
        .pipe(gulp.dest("./"));
    cb();
});

gulp.task(
    'default',
    gulp.series('less', function (cb) {
        gulp.watch('less/*.less', gulp.series('less'));
        cb();
    })
);

gulp.task('build', gulp.series('less'));