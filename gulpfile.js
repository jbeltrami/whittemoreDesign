/**
 * Gulpfile.
 *
 * Gulp with WordPress.
 *
 * Implements:
 *      1. Live reloads browser with BrowserSync.
 *      2. CSS: Sass to CSS conversion, error catching, Autoprefixing, Sourcemaps,
 *         CSS minification, and Merge Media Queries.
 *      3. JS: Concatenates & uglifies Vendor and Custom JS files.
 *      4. Images: Minifies PNG, JPEG, GIF and SVG images.
 *      5. Watches files for changes in CSS or JS.
 *      6. Watches files for changes in PHP.
 *      7. Corrects the line endings.
 *      8. InjectCSS instead of browser page reload.
 *      9. Generates .pot file for i18n and l10n.
 *
 * @author Ahmad Awais (@ahmadawais)
 * @version 1.0.3
 */

/**
 * Configuration.
 *
 * Project Configuration for gulp tasks.
 *
 * In paths you can add <<glob or array of globs>>. Edit the variables as per your project requirements.
 */

// START Editing Project Variables.
// Project related.
const projectURL = '' // Local project URL of your already running WordPress site. Could be something like local.dev or localhost:8888.

// Path to place the compiled CSS file.
// Default set to root folder.
// Style related.
const styleSRC = './src/sass/main.scss' // Path to main .scss file.
const styleDestination = './assets/css/' // Path to place the compiled CSS file.
const sourceStyleDestination = './' // Path to place the CSS source map file.
// Default set to root folder.

// JS Vendor related.
const jsVendorSRC = './src/js/lib/*.js' // Path to JS vendor folder.
const jsVendorDestination = './assets/js/' // Path to place the compiled JS vendors file.
const jsVendorFile = 'vendors' // Compiled JS vendors file name.
// Default set to vendors i.e. vendors.js.

// Images related.
const imagesSRC = './src/img/**/*.{png,jpg,jpeg,gif,svg}' // Source folder of images which should be optimized.
const imagesDestination = './assets/img/' // Destination folder of optimized images. Must be different from the imagesSRC folder.

// Video
const videosSRC = './src/video/**/*.mp4' // Source folder of videos which should be optimized.
const videosDestination = './assets/video/' // Destination folder of optimized videos. Must be different from the videosSRC folder.

// Fonts
const fontsSRC = './src/fonts/**/*.{eot,ttf,woff,svg}'
const fontsDestination = './assets/fonts/'

// Watch files paths.
const styleWatchFiles = './src/sass/**/**/*.scss' // Path to all *.scss files inside css folder and inside them.
const vendorJSWatchFiles = './src/js/lib/*.js' // Path to all vendor JS files.
const customJSWatchFiles = './src/js/custom/**/*.js' // Path to all custom JS files.
const projectPHPWatchFiles = './**/*.{php,twig}' // Path to all PHP and Twig files.

// Browsers you care about for autoprefixing.
// Browserlist https        ://github.com/ai/browserslist
const AUTOPREFIXER_BROWSERS = [
  'last 2 version',
  '> 1%',
  'ie >= 9',
  'ie_mob >= 10',
  'ff >= 30',
  'chrome >= 34',
  'safari >= 7',
  'opera >= 23',
  'ios >= 7',
  'android >= 4',
  'bb >= 10'
]

// STOP Editing Project Variables.

/**
 * Load Plugins.
 *
 * Load gulp plugins and passing them semantic names.
 */
const gulp = require('gulp') // Gulp of-course

// CSS related plugins.
const sass = require('gulp-sass') // Gulp pluign for Sass compilation.
const minifycss = require('gulp-uglifycss') // Minifies CSS files.
const autoprefixer = require('gulp-autoprefixer') // Autoprefixing magic.
const mmq = require('gulp-merge-media-queries') // Combine matching media queries into one media query definition.

// JS related plugins.
const concat = require('gulp-concat') // Concatenates JS files
const uglify = require('gulp-uglify') // Minifies JS files

// Image realted plugins.
const imagemin = require('gulp-imagemin') // Minify PNG, JPEG, GIF and SVG images with imagemin.

// Utility related plugins.
const rename = require('gulp-rename') // Renames files E.g. style.css -> style.min.css
const lineec = require('gulp-line-ending-corrector') // Consistent Line Endings for non UNIX systems. Gulp Plugin for Line Ending Corrector (A utility that makes sure your files have consistent line endings)
const filter = require('gulp-filter') // Enables you to work on a subset of the original files by filtering them using globbing.
const sourcemaps = require('gulp-sourcemaps') // Maps code in a compressed file (E.g. style.css) back to it’s original position in a source file (E.g. structure.scss, which was later combined with other css files to generate style.css)
const notify = require('gulp-notify') // Sends message notification to you
const browserSync = require('browser-sync').create() // Reloads browser and injects CSS. Time-saving synchronised browser testing.
const reload = browserSync.reload // For manual browser reload.
const babelify = require('babelify')
const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const source = require('vinyl-source-stream')
const gutil = require('gulp-util')
const ftp = require('vinyl-ftp')
const dotenv = require('dotenv')

const config = {
  js: {
    src: './src/js/main.js', // Entry point
    outputDir: './assets/js', // Directory to save bundle to
    mapDir: '/maps/', // Subdirectory to save maps to
    outputFile: 'bundle.js' // Name to use for bundle
  }
}

// This method makes it easy to use common bundling options in different tasks
function bundle (bundler) {
  // Add options to add to "base" bundler passed as parameter
  bundler
    .bundle() // Start bundle
    .pipe(source(config.js.src)) // Entry point
    .pipe(buffer()) // Convert to gulp pipeline
    .pipe(rename(config.js.outputFile)) // Rename output from 'main.js'
    //   to 'bundle.js'
    .pipe(sourcemaps.init({
      loadMaps: true
    })) // Strip inline source maps
    .pipe(sourcemaps.write(config.js.mapDir)) // Save source maps to their
    //   own directory
    .pipe(gulp.dest(config.js.outputDir)) // Save 'bundle' to build/
    .on('error', gutil.log)
    .pipe(browserSync.stream())
}

gulp.task('bundle', function () {
  const bundler = browserify(config.js.src) // Pass browserify the entry point
    .transform(babelify, {
      presets: ['es2015']
    }) // Then, babelify, with ES2015 preset

  bundle(bundler) // Chain other options -- sourcemaps, rename, etc.
})

/**
 * Task: `browser-sync`.
 *
 * Live Reloads, CSS injections, Localhost tunneling.
 *
 * This task does the following:
 *    1. Sets the project URL
 *    2. Sets inject CSS
 *    3. You may define a custom port
 *    4. You may want to stop the browser from openning automatically
 */
gulp.task('browser-sync', function () {
  browserSync.init({

    // For more options
    // @link http://www.browsersync.io/docs/options/

    // Project URL.
    proxy: projectURL,

    // `true` Automatically open the browser with BrowserSync live server.
    // `false` Stop the browser from automatically opening.
    open: true,

    // Inject CSS changes.
    // Commnet it to reload browser for every CSS change.
    injectChanges: true

    // Use a specific port (instead of the one auto-detected by Browsersync).
    // port: 7000,

  })
})

/**
 * Task: `styles`.
 *
 * Compiles Sass, Autoprefixes it and Minifies CSS.
 *
 * This task does the following:
 *    1. Gets the source scss file
 *    2. Compiles Sass to CSS
 *    3. Writes Sourcemaps for it
 *    4. Autoprefixes it and generates style.css
 *    5. Renames the CSS file with suffix .min.css
 *    6. Minifies the CSS file and generates style.min.css
 *    7. Injects CSS or reloads the browser via browserSync
 */
gulp.task('styles', function () {
  gulp.src(styleSRC)
    .pipe(sourcemaps.init())
    .pipe(sass({
      errLogToConsole: true,
      outputStyle: 'compact',
      // outputStyle: 'compressed',
      // outputStyle: 'nested',
      // outputStyle: 'expanded',
      precision: 10
    }))
    .on('error', console.error.bind(console))
    .pipe(sourcemaps.write({
      includeContent: false
    }))
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(autoprefixer(AUTOPREFIXER_BROWSERS))

    .pipe(sourcemaps.write(sourceStyleDestination))
    .pipe(lineec()) // Consistent Line Endings for non UNIX systems.
    .pipe(gulp.dest(styleDestination))

    .pipe(filter('**/*.css')) // Filtering stream to only css files
    .pipe(mmq({
      log: true
    })) // Merge Media Queries only for .min.css version.

    .pipe(browserSync.stream()) // Reloads style.css if that is enqueued.

    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(minifycss({
      maxLineLen: 10
    }))
    .pipe(lineec()) // Consistent Line Endings for non UNIX systems.
    .pipe(gulp.dest(styleDestination))

    .pipe(filter('**/*.css')) // Filtering stream to only css files
    .pipe(browserSync.stream()) // Reloads style.min.css if that is enqueued.
  // .pipe( notify( { message: 'TASK: "styles" Completed! 💯', onLast: true } ) )
})

/**
 * Task: `vendorJS`.
 *
 * Concatenate and uglify vendor JS scripts.
 *
 * This task does the following:
 *     1. Gets the source folder for JS vendor files
 *     2. Concatenates all the files and generates vendors.js
 *     3. Renames the JS file with suffix .min.js
 *     4. Uglifes/Minifies the JS file and generates vendors.min.js
 */
gulp.task('vendorsJs', function () {
  gulp.src(jsVendorSRC)
    .pipe(concat(jsVendorFile + '.js'))
    .pipe(lineec()) // Consistent Line Endings for non UNIX systems.
    .pipe(gulp.dest(jsVendorDestination))
    .pipe(rename({
      basename: jsVendorFile,
      suffix: '.min'
    }))
    .pipe(uglify())
    .pipe(lineec()) // Consistent Line Endings for non UNIX systems.
    .pipe(gulp.dest(jsVendorDestination))
    .pipe(notify({
      message: 'TASK: "vendorsJs" Completed! 💯',
      onLast: true
    }))
})

/**
 * Task: `images`.
 *
 * Minifies PNG, JPEG, GIF and SVG images.
 *
 * This task does the following:
 *     1. Gets the source of images raw folder
 *     2. Minifies PNG, JPEG, GIF and SVG images
 *     3. Generates and saves the optimized images
 *
 * This task will run only once, if you want to run it
 * again, do it with the command `gulp images`.
 */
gulp.task('images', function () {
  gulp.src(imagesSRC)
    .pipe(imagemin({
      progressive: true,
      optimizationLevel: 3, // 0-7 low-high
      interlaced: true,
      svgoPlugins: [{
        removeViewBox: false
      }]
    }))
    .pipe(gulp.dest(imagesDestination))
    .pipe(notify({
      message: 'TASK: "images" Completed! 💯',
      onLast: true
    }))
})

gulp.task('fonts', function () {
  gulp.src(fontsSRC)
    .pipe(gulp.dest(fontsDestination))
    .pipe(notify({
      message: 'TASK: "fonts" Completed! 💯',
      onLast: true
    }))
})

gulp.task('videos', function () {
  gulp.src(videosSRC)
    .pipe(gulp.dest(videosDestination))
    .pipe(notify({
      message: 'TASK: "videos" Completed! 💯',
      onLast: true
    }))
})

/**
 * Watch Tasks.
 *
 * Watches for file changes and runs specific tasks.
 */
gulp.task('default', ['styles', 'vendorsJs', 'bundle', 'images', 'fonts', 'videos', 'browser-sync'], function () {
  gulp.watch(projectPHPWatchFiles, reload) // Reload on PHP file changes.
  gulp.watch(styleWatchFiles, ['styles']) // Reload on SCSS file changes.
  gulp.watch(vendorJSWatchFiles, ['vendorsJs', reload]) // Reload on vendorsJs file changes.
  gulp.watch(customJSWatchFiles, ['bundle', reload]) // Reload on customJS file changes.
})

gulp.task('deploy-staging', function () {
  dotenv.load()
  const conn = ftp.create({
    host: process.env.STAGING_NAME,
    user: process.env.STAGING_USER,
    password: process.env.STAGING_PASSWORD,
    parallel: 10,
    log: gutil.log
  })

  const globs = [
    process.env.COMPILED_FOLDER + '/**',
    '!node_modules/**',
    'package.json'
  ]

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance

  return gulp.src(globs, {
    base: './',
    buffer: false
  })
    .pipe(conn.newer(process.env.STAGING_DESTINATION)) // only upload newer files
    .pipe(conn.dest(process.env.STAGING_DESTINATION))
})

gulp.task('deploy-production', function () {
  dotenv.load()
  const conn = ftp.create({
    host: process.env.HOST_NAME,
    user: process.env.HOST_USER,
    password: process.env.HOST_PASSWORD,
    parallel: 10,
    log: gutil.log
  })

  const globs = [
    process.env.COMPILED_FOLDER + '/**'
  ]

  // using base = '.' will transfer everything to /public_html correctly
  // turn off buffering in gulp.src for best performance

  return gulp.src(globs, {
    base: './',
    buffer: false
  })
    .pipe(conn.newer(process.env.HOST_DESTINATION)) // only upload newer files
    .pipe(conn.dest(process.env.HOST_DESTINATION))
})
