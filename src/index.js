/* ========================================================================
 * oly-table
 * ========================================================================
 * ======================================================================== */


// 这个分号的作用是防止和其他jquery插件合并时，别人不规范的jquery插件忘记使用分号结束
//影响到我们当前的插件，导致无法运行的问题。
;(function ($, window, document, undefined) {


    function _arrayDel(arr, val) {
        var index = $.inArray(val, arr)
        if (index > -1) {
            arr.splice(index, 1)
        }
    }


    // 如果变量有值则输出本身，没值则不输出
    // 等式输出用于class，之类的html类标签属性
    function _IF(variable, equ) {
        if (equ) {
            return variable ? `${equ}="${variable}"` : ''
        } else {
            return variable ? variable : ''
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
            serialNumber: false, // 序号
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
        this._cached = {}
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
            const thead = this.getThead(),
                tbody = this.getTbody(),
                isheadFixed = this.settings.headFixed,
                colgroup = this.getColgroup();

            let fixedClassName = isheadFixed ? ` ${pluginClassName+'--fixed'}` : '';

            function getTable(con) {
                return `<table class="${pluginClassName + customClassName + fixedClassName}">${colgroup}${con}</table>`;
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
            const _this = this;
            let select = [];
            const $table = this.GLOBAL.$table;

            // tr 点击事件
            $table.on('click', 'tbody tr', function () {
                const index = $(this).attr(pluginName + "-tr-index");

                $(this).addClass(_this.settings.rowActiveClass)

                // 调 onRowClick 时间，第一个参数当前tr的jquery对象 ，第二个参数：当前行的数据对象
                _this.settings.onRowClick && _this.settings.onRowClick($(this), _this.settings.dataSource[index])
            })
            // checkbox 选择事件
                .on("click", 'input:checkbox', function () {

                    if ($(this).hasClass('j-checkbox-all')) {
                        let $otherCheckbox = $table.find('input').not($(this))


                        if (this.checked) {
                            select = []
                            $otherCheckbox.prop('checked', true);
                            $.each($otherCheckbox, function (index, val) {
                                select.push(val.value)
                            })
                        } else {
                            $otherCheckbox.prop('checked', false)
                        }
                        return
                    }

                    if (this.checked) {
                        _arrayDel(select, this.value)
                        select.push(this.value)
                    } else {
                        _arrayDel(select, this.value)
                    }


                })
        },
        _cache: function (name, val) {
            if (name in this._cached) {
                return this._cached[name];
            }

            // TODO 需要判断 val 的类型赋值
            this._cached[name] = val;

            return this._cached[name];
        },
        groupedColumns: function (columns) {
            const _groupColumns = (columns, currentRow = 0, parentColumn = {}, rows = []) => {
                // track how many rows we got
                rows[currentRow] = rows[currentRow] || [];
                const grouped = [];
                const setRowSpan = column => {
                    const rowSpan = rows.length - currentRow;
                    if (column &&
                        !column.children &&
                        rowSpan > 1 &&
                        (!column.rowSpan || column.rowSpan < rowSpan)
                    ) {
                        column.rowSpan = rowSpan;
                    }
                };
                columns.forEach((column, index) => {
                    const newColumn = column;
                    // const newColumn = { ...column };
                    rows[currentRow].push(newColumn);
                    parentColumn.colSpan = parentColumn.colSpan || 0;
                    if (newColumn.children && newColumn.children.length > 0) {
                        newColumn.children = _groupColumns(newColumn.children, currentRow + 1, newColumn, rows);
                        parentColumn.colSpan = parentColumn.colSpan + newColumn.colSpan;
                    } else {
                        parentColumn.colSpan++;
                    }
                    // update rowspan to all same row columns
                    for (let i = 0; i < rows[currentRow].length - 1; ++i) {
                        setRowSpan(rows[currentRow][i]);
                    }
                    // last column, update rowspan immediately
                    if (index + 1 === columns.length) {
                        setRowSpan(newColumn);
                    }
                    grouped.push(newColumn);
                });
                return grouped;
            };
            return _groupColumns(columns);

        },
        getHeaderRows: function (columns, currentRow = 0, rows) {
            rows = rows || [];
            rows[currentRow] = rows[currentRow] || [];

            columns.forEach(column => {
                if (column.rowSpan && rows.length < column.rowSpan) {
                    while (rows.length < column.rowSpan) {
                        rows.push([]);
                    }
                }
                const cell = {
                    className: column.className || '',
                    title: column.title,
                };
                if (column.children) {
                    this.getHeaderRows(column.children, currentRow + 1, rows);
                }
                if ('colSpan' in column) {
                    cell.colSpan = column.colSpan;
                }
                if ('rowSpan' in column) {
                    cell.rowSpan = column.rowSpan;
                }
                if (cell.colSpan !== 0) {
                    rows[currentRow].push(cell);
                }
            });
            return rows.filter(row => row.length > 0);
        },
        // 标准化数据，一份给编译 body 时候用，是一个一维数组
        normalizeColumns: function () {
            let compilerColumns = [];
            const normalizeColumns = this.settings.columns;
            this.getExtraCol().forEach(val => {
                normalizeColumns.unshift(val)
            });

            this._cache('normalizeColumns',normalizeColumns);

            const _compilerColumns = (columns) => {
                columns.forEach((val) => {
                    if (val.children && val.children.length > 0) {
                        _compilerColumns(val.children)
                    } else {
                        compilerColumns.push(val)
                    }
                })
            };

            _compilerColumns(normalizeColumns);

            this._cache('compilerColumns',compilerColumns);

            return compilerColumns

        },
        wrapTag: function (str,tag) {
            return `<${tag}>${str}</${tag}>`
        },
        getExtraCol: function () {
            const extraCol = [];
            if (this.settings.rowSelection) {
                extraCol.push({
                    title: `<input type="checkbox" class="j-checkbox-all" />`,
                    className: pluginClassName + '__th-checkbox',
                    render: () => {
                        return `<input type="checkbox" />`
                    }
                })
            }

            if (this.settings.serialNumber) {
                extraCol.push({
                    title: '#',
                    className: pluginClassName + '__th-checkbox',
                    render: (a, index) => {
                        return `${index + 1}`
                    }
                })
            }

            return extraCol

        },
        setExtraCol: function (columns) {
            const maxRowSpan = columns.length;
            let newColums = columns;
            const extraCol = this.getExtraCol();

            extraCol.forEach((val) => {
                val.rowSpan = maxRowSpan;
                newColums[0].unshift(val)
            })

            return newColums
        },
        getThead: function () {
            let dom = '',
                _this = this,
                columns = this.getHeaderRows(this.groupedColumns(this.settings.columns));


            // 添加序号、checkbox 等的列
            const newColumns = this.setExtraCol(columns)

            // 存储到 cache
            this._cache('columns', newColumns)

            // 标准化数据，成为一维数组
            this.normalizeColumns(newColumns)

            newColumns.forEach((column) => {
                let tr = '';

                column.forEach((cell, i) => {

                    const colspan = _IF(cell.colSpan, 'colspan');
                    const rowspan = _IF(cell.rowSpan, 'rowspan');
                    const className = _IF(cell.className, 'class');

                    console.log(colspan,rowspan,className)

                    tr += `<th ${colspan}${rowspan}${className}>${cell.title}</th>`
                })

                dom += _this.wrapTag(tr,'tr')
            })


            const thead = `<thead>${dom}</thead>`;

            // console.log($.inArray('children',data))
            return thead
        },
        getBodyRows: function (dataSource) {
            let tbody = '',
                row = '';

            const compilerColumns = this._cache('compilerColumns')

            const _getBodyRow = (value, columns, currentRow) => {

                columns.forEach((val) => {
                        //如果有render 方法的，直接调用render方法，并把这个td的值传进去
                        if (val.render) {
                            const cellData = value[val.dataIndex]
                            // 传递 当前cell 的值 ， 索引 ， 当前行的数据对象
                            row += `<td>${val.render(cellData, currentRow, value)}</td>`
                        } else {
                            row += `<td>${value[val.dataIndex]}</td>`
                        }
                });

                return row
            };

            dataSource.forEach((value, index) => {

                row = '';
                _getBodyRow(value, compilerColumns, index);
                tbody += `<tr ${pluginName}-tr-index="${index}">${row}</tr>`

            });

            return tbody
        },
        getTbody: function () {
            const data = this.settings.dataSource;
            const tbody = this.getBodyRows(data);

            return `<tbody>${tbody}</tbody>`
        },
        getColgroup:function () {
            let cols = '';

            this._cache('compilerColumns').forEach(col => {
                cols += `<col ${_IF(col.width,'width')} ${_IF(col.className,'class')}>`
            });

            return this.wrapTag(cols,'colgroup')

        },
        // 用 for 循环实现，但是性能没提升
        // getTbodyf: function () {
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
