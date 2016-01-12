var gulp = require('gulp'),
     log = require('gulp-util').log,
   spawn = require('child_process').spawn,
    exec = require('child_process').exec,
      sh = require('sh'),
    bump = require('gulp-bump'),
  jshint = require('gulp-jshint'),
 replace = require('gulp-replace'),
    argv = require('yargs').array('browsers').argv;

gulp.task('karma', function (done) {
    var karma = require('karma');

    var server = new karma.Server({
        configFile: __dirname + '/configs/karma.conf.js',
        singleRun: argv.dev ? false : true
    }, function(exitStatus) {
        done(exitStatus ? "There are failing unit tests" : undefined);
    });

    server.start();
});

gulp.task('render', function (done) {
    var path = require('path'),
        glob = require('glob'),
       async = require('async'),
     webshot = require('webshot');

    var charts = glob(path.join(__dirname, 'tests/Examples/Charts/*.php'), function (err, charts) {

    charts.map(function (chartPath) {
      var chart = chartPath.match(/([a-zA-Z]+).php$/)[1];
      var port = 8946;
      var phpserver = spawn('php', ['-S', '127.0.0.1:'+port, '-c', 'php.ini', 'router.php'], {cwd: 'tests/Examples'});
      var url = 'http://127.0.0.1:'+port+'/' + chart;
      var output = 'build/renders/' + chart + '.png';

      webshot(url, output, {
        renderDelay: 5000,
        errorIfJSException: true,
        captureSelector: 'body>div'
      }, function (err) {
          if (err) { log(err); }

          log('Rendered ' + chart);
          port++;
          phpserver.kill('SIGINT');
      });
    });
  });
});

gulp.task('php:test', function (done) {
    var test = spawn('./vendor/bin/phpunit', ['-c', 'configs/phpunit.xml']);

    test.on('data', function (data) {
        log(data);
    });
});

gulp.task('php:coverage', function (done) {
    sh('./vendor/bin/phpunit -c configs/phpunit.xml.coverage');
});

gulp.task('php:cs', function (done) {
    sh('./vendor/bin/phpcs -n --standard=PSR2 ./src ./tests');
});

gulp.task('php:fix', function (done) {
    sh('./vendor/bin/phpcbf -n --standard=PSR2 ./src ./tests');
});

gulp.task('js:lint', function (done) {
    gulp.src('./javascript/lava.js')
        .pipe(jshint());
});

gulp.task('bump', function (done) { //-v=1.2.3
    var version = argv.v;
    var minorVersion = version.slice(0, -2);

    gulp.src('./package.json')
        .pipe(bump({version:argv.v}))
        .pipe(gulp.dest('./'));

    gulp.src(['./README.md', './.travis.yml'])
        .pipe(replace(/("|=|\/|-)[0-9]+\.[0-9]+/g, '$1'+minorVersion))
        .pipe(gulp.dest('./'));
});
