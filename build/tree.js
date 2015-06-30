function viewTree(context, options) {
  $('#mytree').remove();
  options = options || {};

  var markup = Tree.Templates.Main();

  var getNodes = typeof options.getNodes === 'function' ? options.getNodes : function(context) { return Object.keys(context); };
  var getValue = typeof options.getValue === 'function' ? options.getValue : function(context, node) { return context[node]; };
  var getProperties = typeof options.getProperties === 'function' ? options.getProperties : void 0;
  var $el = options.el ? $(options.el) : $(markup).appendTo('body').hide().show(500).find('.tree-main');
  var $main = options.el ? $el : $('#mytree');
  var $props = $main.find('.tree-properties');

  function exit() {
    $main.hide(300);
    setTimeout(function() { $main.remove(); }, 300);
  }

  function clearTree() {
    $el.empty();
  }

  function expand(node) {
    var $node = $(node);

    $node.trigger('expand');
    if ($node.children('ul').length) {
      $node.attr('data-expanded', true);
    } else {
      $node.removeAttr('data-expanded');
    }
  }

  function collapse(node) {
    var $node = $(node);
    $node.trigger('collapse');
    $node.attr('data-expanded', false);
  }

  function renderFullTree($root, context) {
    if (!context) {
      return;
    }

    var keys = getNodes(context);
    if (keys && keys.length) {
      $root.attr('data-expanded', false);
      var $subTree = $('<ul></ul>').appendTo($root);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var childContext = getValue(context, key);
        if (typeof childContext === 'function') {
          continue;
        }
        var $child = $('<li class="node"><span class="icon"></span><span class="key">'+key+'</span></li>').appendTo($subTree);
        $child.data('context', childContext);
        if (childContext === null || typeof childContext !== 'object') {
          $child.append('<span class="value">' + childContext + '</span>');
        } else {
          $child.on('expand', function() {
            var $node = $(this);
            if (!$node.data('traversed')) {
              renderFullTree($node, $node.data('context'));
              $node.data('traversed', true);
            }
          });
          if (childContext) {
            var childSubtreeNodes = getNodes(childContext);
            if (childSubtreeNodes && childSubtreeNodes.length) {
              collapse($child);
            }

            if (typeof getProperties === 'function') {
              var properties = childContext && getProperties(childContext);
              if (properties && properties.length) {
                $child.append('<span class="props"></span>');
              }
            }
          }
        }
        registerNodeEventListeners($child);
      }
    }
  }

  function renderNodeProperties($el, context) {
    if (!context) {
      return;
    }

    var keys = getProperties(context);
    if (keys && keys.length) {
      $el.attr('data-expanded', false);
      var $subTree = $('<ul></ul>').appendTo($el);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var childContext = context[key];
        if (typeof childContext === 'function') {
          continue;
        }
        var $child = $('<li class="node"><span class="icon"></span><span class="key">'+key+'</span></li>').appendTo($subTree);
        $child.data('context', childContext);
        if (childContext === null || typeof childContext !== 'object') {
          $child.append('<span class="value">' + childContext + '</span>');
        } else {
          $child.on('expand', function() {
            var $node = $(this);
            if (!$node.data('traversed')) {
              renderNodeProperties($node, $node.data('context'));
              $node.data('traversed', true);
            }
          });
          if (childContext) {
            var childSubtreeNodes = getProperties(childContext);
            if (childSubtreeNodes && childSubtreeNodes.length) {
              collapse($child);
            }
          }
        }

        registerNodeEventListeners($child);

        if (!childContext || key.indexOf('_') === 0) {
          $child.addClass('extra');
        }
      }
    }
  }

  function viewProperties($node) {
    $props.empty();
    $('.properties-parent').text($node.find('.key').text());
    renderNodeProperties($props, $node.data('context'));
    $main.addClass('properties-mode');
  }

  function renderFlatTree($list, context, prefix, predicate) {
    if (!context) {
      return;
    }

    var keys = getNodes(context);
    predicate = typeof predicate === 'function' && predicate || function() { return true; };

    if (keys && keys.length) {
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var nodeName = prefix ? (prefix + '.' + key) : key;
        var childContext = getValue(context, key);
        if (predicate(key, childContext)) {
          var $child = $('<li class="node"><span class="icon"></span><span class="key">'+nodeName+'</span></li>').appendTo($list);
          $child.data('context', childContext);
          $child.on('expand', function() {
            var $node = $(this);
            if (!$node.data('traversed')) {
              renderFullTree($node, $node.data('context'));
              $node.data('traversed', true);
            }
          });
          if (childContext) {
            var childSubtreeNodes = getNodes(childContext);
            if (childSubtreeNodes && childSubtreeNodes.length) {
              collapse($child);
            }
          }
          registerNodeEventListeners($child);
        } else {
          renderFlatTree($list, childContext, nodeName, predicate);
        }
      }
    }
  }

  function filterTree(term) {
    clearTree();

    if (term) {
      var $list = $('<ul></ul>').appendTo($el);
      renderFlatTree($list, context, '', function(key) {
        return key && key.toLowerCase().indexOf(term.toLowerCase()) !== -1;
      });
    } else {
      renderFullTree($el, context);
    }
  }

  function registerBaseEventListeners() {
    $(document).on('keyup', function(evt) {
      if(evt.keyCode === 27) {
        exit();
        return false;
      }
    });

    $main.find('.exit-treeview').on('click', exit);

    $main.find('.search').on('keyup', function(evt) {
      var $input = $(this),
        term;

      if(evt.keyCode === 27) {
        $input.val('').blur();
      }
      term = $input.val();
      filterTree(term);
      evt.stopImmediatePropagation();
      return false;
    });

    $main.find('.exit-props').on('click', function() {
      $main.removeClass('properties-mode');
    });

    $main.find('.minimal-checkbox input').on('change', function(evt) {
      $props.toggleClass('minimal', $(evt.currentTarget).is(':checked'));
    });
  }

  function registerNodeEventListeners(node) {
    var $node = node && $(node) || $main.find('.node');

    $node.find('.icon').click(function() {
      var $node = $(this).closest('.node'),
        expanded = $node.attr('data-expanded');

      if (typeof expanded !== 'undefined') {
        if (expanded === 'true') {
          collapse($node);
        } else {
          expand($node);
        }
      }
    });

    $node.find('.key').click(function() {
      $('.key.selected').removeClass('selected');
      window.ref = $(this).addClass('selected').closest('.node').data('context');
    });

    $node.find('.props').click(function() {
      viewProperties($node);
    });
  }

  registerBaseEventListeners();
  renderFullTree($el, context);
}


this["Tree"] = this["Tree"] || {};
this["Tree"]["Templates"] = this["Tree"]["Templates"] || {};

this["Tree"]["Templates"]["Main"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div id=\"mytree\">\r\n  <button class=\"exit-treeview\" title=\"Exit\">&times;</button>\r\n  <div class=\"content-wrapper\">\r\n    <div class=\"top-bar\">\r\n      <div class=\"top-main\">\r\n        <input type=\"text\" class=\"search\" placeholder=\"Looking for something specific? Search here...\"/>\r\n      </div>\r\n      <div class=\"top-props\">\r\n        <div class=\"exit-props\">&lt;&lt;&nbsp;Go back</div>\r\n        <div class=\"props-heading\">\r\n          <span>Properties of <span class=\"properties-parent\"></span> :</span>\r\n          <label class=\"minimal-checkbox\">\r\n            <input type=\"checkbox\" checked>\r\n            <span>Minimal</span>\r\n          </label>\r\n        </div>\r\n      </div>\r\n    </div>\r\n    <div class=\"tree-content\">\r\n      <div class=\"tree-main\"></div>\r\n      <div class=\"tree-properties minimal\"></div>\r\n    </div>\r\n  </div>\r\n</div>";
  });