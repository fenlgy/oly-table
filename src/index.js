/* ========================================================================
 * oly-table
 * ========================================================================
 * ======================================================================== */


// 这个分号的作用是防止和其他jquery插件合并时，别人不规范的jquery插件忘记使用分号结束
//影响到我们当前的插件，导致无法运行的问题。
;(function ($, window, document, undefined) {


    function arrayDel(arr,val) {
        var index = $.inArray(val,arr)
        console.log(index)
        if(index > -1){
            arr.splice(index,1)
        }
    }

    // undefined作为形参的目的是因为在es3中undefined是可以被修改的
    //比如我们可以声明var undefined = 123,这样就影响到了undefined值的判断，幸运的是在es5中,undefined不能被修改了。
    // window和document本身是全局变量，在这个地方作为形参的目的是因为js执行是从里到外查找变量的（作用域），把它们作为局部变量传进来，就避免了去外层查找，提高了效率。

    // 声明默认属性对象
    var pluginName = "olyTable",
        pluginClassName = 'oly-table',

        defaults = {
            size: "normal",
            // className: "oly-table",
            rowActiveClass: 'acti',
            columns: null,
            colResize: false,
            dataSource: null,
            loading: false,
            bordered: true,
            serialNumber:false, // 序号
            scroll: false,
            headFixed: false,
            rowSelection: false, // 是否带check box
        };


    // 构造函数
    function Plugin(element, options) {
        this.$element = element;
        // 将默认属性对象和传递的参数对象合并到第一个空对象中
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        //放置一些全局要用的变量，如jquery 对象
        this.GLOBAL = {};
        this.init();
    }

    Plugin.VERSION = '0.0.1';

    // 为了避免和原型对象Plugin.prototype的冲突，这地方采用继承原型对象的方法
    $.extend(Plugin.prototype, {
        init: function () {

            this.beforeRender();
            this.render();
            this.afterRender();

        },
        getHtml: function () {
            let customClassName = this.settings.className ? ' ' + this.settings.className : '';
            const thead = this.generateThead(),
                tbody = this.generateTbody(),
                isheadFixed = this.settings.headFixed;

            function getTable(con) {
                return `<table class="${pluginClassName + customClassName}">${con}</table>`;
            }

            let html = '';
            if (isheadFixed) {
                html = `<div class="${pluginClassName + '__wrapper'}">
                            <div class="${pluginClassName + '__fixed-thead'}">${getTable(thead)}</div>
                            <div class="${pluginClassName + '__body'}">${getTable(tbody)}</div>
                         </div>`;
            } else {
                html = `<div class="${pluginClassName + '__wrapper'}">${getTable(thead + tbody)}</div>`;
            }

            return html;
        },
        render: function () {
            const $element = $(this.$element);
            const $html = $(this.getHtml());

            $element.append($html);

            this.GLOBAL.$table = $html;
        },
        destroy: function () {
            console.log(this)
        },
        beforeRender: function () {
            this.settings.beforeRender && this.settings.beforeRender($(this.$element))
        },
        // 组件渲染完成后执行，可以在这里初始化其他组件
        afterRender: function () {
            this.bindHandler();
            this.settings.afterRender && this.settings.afterRender($(this.$element))
        },
        bindHandler: function () {
            const that = this;
            let select = [];
            const $table = this.GLOBAL.$table;

            // tr 点击事件
            $table.on('click', 'tbody tr', function () {
                const index = $(this).attr(pluginName + "-tr-index");

                $(this).addClass(that.settings.rowActiveClass)

                // 调 onRowClick 时间，第一个参数当前tr的jquery对象 ，第二个参数：当前行的数据对象
                that.settings.onRowClick && that.settings.onRowClick($(this), that.settings.dataSource[index])
            })
                // checkbox 选择事件
                .on("click", 'input:checkbox', function () {

                    if($(this).hasClass('j-checkbox-all')){
                        let $otherCheckbox = $table.find('input').not($(this))


                        if(this.checked){
                            select = []
                            $otherCheckbox.prop('checked',true);
                            $.each($otherCheckbox,function (index,val) {
                                select.push(val.value)
                            })
                        }else {
                            $otherCheckbox.prop('checked',false)
                        }
                        return
                    }

                    if(this.checked){
                        arrayDel(select,this.value)
                        select.push(this.value)
                    }else {
                        arrayDel(select,this.value)
                    }

                    console.log(select)

                })
        },
        generateThead: function () {
            let dom = '',
                data = this.settings.columns;

            if(this.settings.serialNumber){
                dom = `<th class="${pluginClassName + '__th-checkbox'}">#</th>`
            }

            if (this.settings.rowSelection) {
                dom += `<th class="${pluginClassName + '__th-checkbox'}"><input type="checkbox" class="j-checkbox-all"></th>`
            }


            $.each(data, function (index, value) {
                dom += `<th>${value.title}</th>`
            })

            const thead = `<thead><tr>${dom}</tr></thead>`;

            return thead
        },
        generateTbody: function () {
            let tbody = '',
                isRowSelection = this.settings.rowSelection,
                isSerialNumber = this.settings.serialNumber,
                data = this.settings.dataSource,
                columns = this.settings.columns;

            $.each(data, function (index, value) {
                let tr = '';

                if(isSerialNumber){
                    tr = `<td class="${pluginClassName + '__th-checkbox'}">${index + 1}</td>`
                }

                if (isRowSelection) {
                    tr += `<td><input type="checkbox" value="${index}"></td>`
                }

                $.each(columns, function (i, val) {

                    //TODO 只支持二级，三级暂无需求
                    if(val.children){
                        $.each(val.children,function (ii, vv) {
                            console.log(vv,1)
                            //如果有render 方法的，直接调用render方法，并把这个td的值传进去
                            if (vv.render) {
                                // 传递2个值，第一个为该 td 的值，第二个为该行的对象
                                tr += `<td>${vv.render(value[vv.dataIndex], value)}</td>`
                            } else {
                                tr += `<td>${value[vv.dataIndex]}</td>`
                            }
                        })
                        return
                    }

                    //如果有render 方法的，直接调用render方法，并把这个td的值传进去
                    if (val.render) {
                        // 传递2个值，第一个为该 td 的值，第二个为该行的对象
                        tr += `<td>${val.render(value[val.dataIndex], value)}</td>`
                    } else {
                        tr += `<td>${value[val.dataIndex]}</td>`
                    }
                })

                tbody += `<tr ${pluginName}-tr-index="${index}">${tr}</tr>`
            })

            const dom = `<tbody>${tbody}</tbody>`;

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
