/* ========================================================================
 * oly-table
 * ========================================================================
 * ======================================================================== */


// 这个分号的作用是防止和其他jquery插件合并时，别人不规范的jquery插件忘记使用分号结束
//影响到我们当前的插件，导致无法运行的问题。
;(function ($, window, document, undefined) {

    // undefined作为形参的目的是因为在es3中undefined是可以被修改的
    //比如我们可以声明var undefined = 123,这样就影响到了undefined值的判断，幸运的是在es5中,undefined不能被修改了。
    // window和document本身是全局变量，在这个地方作为形参的目的是因为js执行是从里到外查找变量的（作用域），把它们作为局部变量传进来，就避免了去外层查找，提高了效率。

    // 声明默认属性对象
    var pluginName = "olyTable",

        defaults = {
            size: "normal",
            className: "oly-table",
            rowActiveClass:'acti',
            columns: null,
            dataSource: null,
            loading: false,
            bordered: true,
            scroll: false,
            rowSelection:false, // 是否带check box
        };


    // 构造函数
    function Plugin(element, options) {
        this.$element = element;
        // 将默认属性对象和传递的参数对象合并到第一个空对象中
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        //放置一些全局要用的变量，如jquery 对象
        this.GLOBAL ={};
    }

    Plugin.VERSION = '0.0.1'

    // 为了避免和原型对象Plugin.prototype的冲突，这地方采用继承原型对象的方法
    $.extend(Plugin.prototype, {
        init: function () {
            const $element = $(this.$element);
            const $table = $(this.getHtml().table);

            this.GLOBAL = {
                $table : $table
            };

            $element.append($table);
            this.bindHandler()

        },
        getHtml: function () {
            const thead = this.generateThead(),
                tbody = this.generateTbody();

            let tableClassName = this._defaults.className;
            return {
                table: `<table class="${tableClassName}">${thead + tbody}</table>`,
                thead: thead,
                tbody: tbody
            }
        },
        destroy:function () {
          console.log(this)
        },
        bindHandler: function () {
            const that = this;
            let select = [];

            // tr 点击事件
            this.GLOBAL.$table.on('click','tbody tr',function () {
                const index = $(this).attr(pluginName+"-tr-index");

                $(this).addClass(that.settings.rowActiveClass)

                // 调 onRowClick 时间，第一个参数当前tr的jquery对象 ，第二个参数：当前行的数据对象
                that.settings.onRowClick && that.settings.onRowClick($(this),that.settings.dataSource[index])
            })
                .on("click",'input:checkbox',function () {

                })
        },
        generateThead: function () {
            let dom = '',
                data = this.settings.columns;

            if(this.settings.rowSelection){
                dom = `<td><input type="checkbox"></td>`
            }

            $.each(data, function (index, value) {
                dom += `<th>${value.title}</th>`
            })

            const thead = `<thead><tr>${dom}</tr></thead>`

            return thead
        },
        generateTbody: function () {
            let tbody = '',
                isRowSelection = this.settings.rowSelection,
                data = this.settings.dataSource,
                columns = this.settings.columns;

            $.each(data, function (index, value) {
                let tr = '';
                if(isRowSelection){
                    tr = `<td><input type="checkbox" value="${index}"></td>`
                }
                $.each(columns, function (i, val) {
                    //如果有render 方法的，直接调用render方法，并把这个td的值传进去
                    if(val.render){
                        // 传递2个值，第一个为该 td 的值，第二个为该行的对象
                        tr += `<td>${val.render(value[val.dataIndex],value)}</td>`
                    }else{
                        tr += `<td>${value[val.dataIndex]}</td>`
                    }
                })

                tbody += `<tr ${pluginName}-tr-index="${index}">${tr}</tr>`
            })

            const dom = `<tbody>${tbody}</tbody>`

            return dom
        },
        // 用 for 循环实现，但是性能没提升
        // generateTbodyf: function () {
        //     let tbody = '',
        //         data = this.settings.dataSource,
        //         columns = this.settings.columns;
        //     for(let i=0,l=data.length; i < l;i++) {
        //         // 一行数据
        //         let tr = '';
        //
        //         for(let ii = 0,ll = columns.length;ii < ll;ii++) {
        //             tr += `<td>${data[i][columns[ii].dataIndex]}</td>`
        //         }
        //
        //         tbody += `<tr>${tr}</tr>`
        //     }
        //
        //     const dom = `<tbody>${tbody}</tbody>`
        //
        //     return dom
        // }
    });

    // 对构造函数的一个轻量级封装，
    // 防止产生多个实例
    $.fn[pluginName] = function (options) {
        this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin(this, options));
            }
        });

        // 方便链式调用
        return this;
    };

})(jQuery, window, document);
