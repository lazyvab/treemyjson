function viewTree(context, options) {
  $('#mytree').remove();
  options = options || {};

  var markup = [
    '<div id="mytree">',
      '<div class="tree-toolbar row fixed">',
        '<div class="cell left-section">',
			'<button class="expand-all" title="Expand All">[[+]]</button>',
			'<button class="collapse-all" title="Collapse All">[[-]]</button>',
		'</div>',        
		'<input type="text" class="search cell" placeholder="Looking for something specific? Search here..."/>',
		'<div class="cell right right-section">',
			'<button class="exit-treeview" title="Exit">X</button>',
		'</div>',
      '</div>',
      '<div class="tree-content"></div>',
    '</div>'
  ].join('');

  var getNodes = typeof options.getNodes === 'function' ? options.getNodes : function(context) { return Object.keys(context); };
  var getValue = typeof options.getValue === 'function' ? options.getValue : function(context, node) { return context[node]; };
  var $el = options.el ? $(options.el) : $(markup).appendTo('body').hide().show(500).find('.tree-content');
  var $main = options.el ? $el : $('#mytree');

  var clearTree = function() {
    $el.empty();
  };

  var renderFullTree = function($root, context) {
    // TODO: To optimize, create nodes of a subtree on expansion
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
          renderFullTree($child, childContext);
        }
      }
    }
  };

  var renderFlatTree = function($list, context, prefix, predicate) {
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
          renderFullTree($child, childContext);
        } else {
          renderFlatTree($list, childContext, nodeName, predicate);
        }
      }
    }
  };

  var filterTree = function(term) {
    clearTree();

    if (term) {
      var $list = $('<ul></ul>').appendTo($el);
      renderFlatTree($list, context, '', function(key) {
        return key && key.toLowerCase().indexOf(term.toLowerCase()) !== -1;
      });
    } else {
      renderFullTree($el, context);
    }

    registerTreeEventListeners();
  };

  var exit = function() {
	$main.hide(300);
    setTimeout(function() { $main.remove(); }, 300);
  };
  
  var registerBaseEventListeners = function() {
    $(document).on('keyup', function(evt) {
      if(evt.keyCode === 27) {
        exit();
      }
    });

	$main.find('.exit-treeview').on('click', exit);
	
    $main.find('.expand-all').on('click', function() {
      $('.node[data-expanded]').attr('data-expanded', true);
    });

    $main.find('.collapse-all').on('click', function() {
      $('.node[data-expanded]').attr('data-expanded', false);
    });

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
  };

  var registerTreeEventListeners = function() {
    $main.find('.node .icon').click(function() {
      var $node = $(this).closest('.node'),
        expanded = $node.attr('data-expanded');

      if (typeof expanded !== 'undefined') {
        $node.attr('data-expanded', !(expanded == 'true'));
      }
    });

    $main.find('.node .key').click(function() {
      $('.key.selected').removeClass('selected');
      window.ref = $(this).addClass('selected').closest('.node').data('context');
    });
  };

  registerBaseEventListeners();
  renderFullTree($el, context);
  registerTreeEventListeners();
}

