function viewTree(context, options) {
  $('#mytree').remove();
  options = options || {};

  var markup = Tree.Templates.Main();

  var getNodes = typeof options.getNodes === 'function' ? options.getNodes : function(context) { return Object.keys(context); };
  var getValue = typeof options.getValue === 'function' ? options.getValue : function(context, node) { return context[node]; };
  var $el = options.el ? $(options.el) : $(markup).appendTo('body').hide().show(500).find('.tree-content');
  var $main = options.el ? $el : $('#mytree');

  function exit() {
    $main.hide(300);
    setTimeout(function() { $main.remove(); }, 300);
  }

  function clearTree() {
    $el.empty();
  }

  function expand(node) {
    var $node = $(node);

    if (!$node.data('traversed')) {
      renderFullTree($node, $node.data('context'));
      $node.data('traversed', true);
    }
    if ($node.children('ul').length) {
      $node.attr('data-expanded', true);
    } else {
      $node.removeAttr('data-expanded');
    }
  }

  function collapse(node) {
    $(node).attr('data-expanded', false);
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
        var $child = $('<li class="node"><span class="icon"></span><span class="key">'+key+'</span></li>').appendTo($subTree);
        var childContext = getValue(context, key);
        $child.data('context', childContext);
        if (typeof childContext !== 'object') {
            $child.append('<span class="value">'+childContext+'</span>');
        } else {
          collapse($child);
          registerNodeEventListeners($child);
        }
      }
    }
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
          collapse($child);
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
  }

  registerBaseEventListeners();
  renderFullTree($el, context);
}


this["Tree"] = this["Tree"] || {};
this["Tree"]["Templates"] = this["Tree"]["Templates"] || {};

this["Tree"]["Templates"]["Main"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div id=\"mytree\">\r\n  <button class=\"exit-treeview\" title=\"Exit\">&times;</button>\r\n  <div class=\"search-bar\">\r\n    <input type=\"text\" class=\"search\" placeholder=\"Looking for something specific? Search here...\"/>\r\n  </div>\r\n  <div class=\"tree-content\"></div>\r\n</div>";
  });