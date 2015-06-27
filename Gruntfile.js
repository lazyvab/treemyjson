module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');
  var files = { js: [], css: [], less: [], hbs: [], libs: [] };

  (function processFilesList() {
    var filesList;

    try {
      filesList = grunt.file.readJSON('files.list');
    } catch(e) {
      throw new Error('Unable to read/parse list of files to include in component build.\n' + e.message);
    }

    for (var i = 0; i < filesList.length; i++) {
      var file = filesList[i],
        ext = file.substring(file.lastIndexOf('.') + 1);

      if (ext !== file && files[ext]) {
        files[ext].push(file);
      }
    }
  })();

  grunt.initConfig({
    pkg: pkg,

    buildFolder: 'build',

    watch: {
      files: ['**/*'],
      tasks: ['build']
    },

    concat: {
      js: {
        files: {
          '<%= buildFolder %>/<%= pkg.name %>.js': files.js
        }
      },

      hbs: {
        files: {
          '<%= buildFolder %>/<%= pkg.name %>.js': [
            '<%= buildFolder %>/<%= pkg.name %>.js',
            '<%= buildFolder %>/temp/<%= pkg.name %>.hbs.js'
          ]
        }
      },

      css: {
        files: {
          '<%= buildFolder %>/<%= pkg.name %>.css': files.css.push('<%= buildFolder %>/<%= pkg.name %>.css') && files.css
        }
      }
    },

    less: {
      build: {
        files: {
          '<%= buildFolder %>/<%= pkg.name %>.css': files.less
        }
      }
    },

    cssmin: {
      build: {
        files: {
          '<%= buildFolder %>/<%= pkg.name %>.min.css': '<%= buildFolder %>/<%= pkg.name %>.css'
        }
      }
    },

    handlebars: {
      options: {
        namespace: 'Templates',
        processName: function (filepath) {
          return filepath.replace(/^.*\/([^\/]+)\.hbs$/, '$1');
        }
      },
      all: {
        files: {
          '<%= buildFolder %>/temp/<%= pkg.name %>.hbs.js': files.hbs
        }
      }
    },

    uglify: {
      build: {
        files: {
          '<%= buildFolder %>/<%= pkg.name %>.min.js': '<%= buildFolder %>/<%= pkg.name %>.js'
        }
      }
    },

    copy: {
      libs: {
        files: [{
          expand: true,
          flatten: true,
          src: files.libs.push('src/libs/*') && files.libs,
          dest: '<%= buildFolder %>/libs/',
          filter: 'isFile'
        }]
      }
    },

    clean: {
      build: {
        src: '<%= buildFolder %>'
      },
      temp: {
        src: ['<%= buildFolder %>/temp']
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-handlebars');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask(
    'css',
    'Compiles and minifies the stylesheets',
    [ 'less', 'concat:css', 'cssmin' ]
  );

  grunt.registerTask(
    'js',
    'concat js files',
    [ 'concat:js' ]
  );

  grunt.registerTask(
    'hbs',
    'compile hbs and append to js',
    [ 'handlebars', 'concat:hbs']
  );

  grunt.registerTask(
    'build',
    'build project',
    [ 'clean:build', 'css', 'js', 'hbs', 'uglify', 'copy:libs', 'clean:temp' ]
  );
};
