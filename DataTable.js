(function (global)
{
    "use strict";

    const DataRowState = {
        Detached: 1,
        Unchanged: 2,
        Added: 4,
        Deleted: 8,
        Modified: 16
    };

    function DataColumn(name, type, options)
    {

        options = options ||
        {};

        this.ColumnName = name;
        this.DataType = type || String;

        this.AllowDBNull =
            options.AllowDBNull !== false;

        this.DefaultValue =
            options.DefaultValue;

        this.Unique =
            options.Unique === true;

        this.AutoIncrement =
            options.AutoIncrement === true;

        this.AutoIncrementSeed =
            options.AutoIncrementSeed || 1;

        this.AutoIncrementStep =
            options.AutoIncrementStep || 1;

        this._autoValue =
            this.AutoIncrementSeed;
    }

    function DataColumnCollection(table)
    {

        this._table = table;
        this._items = [];
    }

    DataColumnCollection.prototype.Add =
        function (name, type, options)
        {

            const col =
                new DataColumn(
                    name,
                    type,
                    options
                );

            this._items.push(col);

            return col;
        };

    DataColumnCollection.prototype.Remove =
        function (name)
        {

            const i =
                this._items.findIndex(
                    c => c.ColumnName === name
                );

            if (i >= 0)
                this._items.splice(i, 1);
        };

    DataColumnCollection.prototype.Item =
        function (name)
        {

            return this._items.find(
                c => c.ColumnName === name
            );
        };

    Object.defineProperty(
        DataColumnCollection.prototype,
        "Count",
        {
            get()
            {
                return this._items.length;
            }
        });

    function DataRow(table)
    {

        this._table = table;

        this.RowState =
            DataRowState.Detached;

        this._originalValues = {};

        table.Columns._items.forEach(col =>
        {

            if (col.AutoIncrement)
            {

                this[col.ColumnName] =
                    col._autoValue;

                col._autoValue +=
                    col.AutoIncrementStep;
            }
            else
            {

                this[col.ColumnName] =
                    col.DefaultValue !== undefined ?
                    col.DefaultValue :
                    null;
            }
        });
    }

    DataRow.prototype.AcceptChanges =
        function ()
        {

            this._originalValues = {};

            this._table.Columns._items.forEach(col =>
            {

                this._originalValues[col.ColumnName] =
                    this[col.ColumnName];
            });

            this.RowState =
                DataRowState.Unchanged;
        };

    DataRow.prototype.RejectChanges =
        function ()
        {

            const self = this;

            Object.keys(this._originalValues)
                .forEach(function (k)
                {

                    self[k] =
                        self._originalValues[k];
                });

            this.RowState =
                DataRowState.Unchanged;
        };

    DataRow.prototype.SetValue =
        function (column, value)
        {

            if (this.RowState ===
                DataRowState.Unchanged)
            {

                this.RowState =
                    DataRowState.Modified;
            }

            this[column] = value;
        };

    DataRow.prototype.toObject =
        function ()
        {

            const obj = {};

            this._table.Columns._items
                .forEach(c =>
                {

                    obj[c.ColumnName] =
                        this[c.ColumnName];
                });

            return obj;
        };

    function DataRowCollection(table)
    {

        this._table = table;
        this._items = [];
    }

    DataRowCollection.prototype.Add =
        function (row)
        {

            if (!(row instanceof DataRow))
                throw new Error(
                    "DataRow expected"
                );

            validateRow(row);

            row.RowState =
                DataRowState.Added;

            this._items.push(row);

            return row;
        };

    DataRowCollection.prototype.Remove =
        function (row)
        {

            const idx =
                this._items.indexOf(row);

            if (idx >= 0)
            {

                row.RowState =
                    DataRowState.Deleted;

                this._items.splice(idx, 1);
            }
        };

    DataRowCollection.prototype.Clear =
        function ()
        {

            this._items.length = 0;
        };

    DataRowCollection.prototype.Item =
        function (index)
        {

            return this._items[index];
        };

    Object.defineProperty(
        DataRowCollection.prototype,
        "Count",
        {
            get()
            {
                return this._items.length;
            }
        });

    function DataTable(name)
    {

        this.TableName =
            name || "";

        this.Columns =
            new DataColumnCollection(this);

        this.Rows =
            new DataRowCollection(this);

        this.PrimaryKey = null;
    }

    DataTable.prototype.NewRow =
        function ()
        {

            return new DataRow(this);
        };

    DataTable.prototype.Clear =
        function ()
        {

            this.Rows.Clear();
        };

    DataTable.prototype.AcceptChanges =
        function ()
        {

            this.Rows._items.forEach(
                r => r.AcceptChanges()
            );
        };

    DataTable.prototype.RejectChanges =
        function ()
        {

            this.Rows._items.forEach(
                r => r.RejectChanges()
            );
        };

    DataTable.prototype.ImportRow =
        function (row)
        {

            const nr =
                this.NewRow();

            this.Columns._items
                .forEach(col =>
                {

                    nr[col.ColumnName] =
                        row[col.ColumnName];
                });

            this.Rows.Add(nr);
        };

    DataTable.prototype.AddRow =
        function (obj)
        {

            const row =
                this.NewRow();

            Object.keys(obj)
                .forEach(k =>
                {

                    row[k] = obj[k];
                });

            this.Rows.Add(row);

            return row;
        };

    DataTable.prototype.Find =
        function (value)
        {

            if (!this.PrimaryKey)
                throw new Error(
                    "PrimaryKey not defined"
                );

            return this.Rows._items.find(
                r => r[this.PrimaryKey] === value
            );
        };

    DataTable.prototype.Select =
        function (expression)
        {

            const m =
                expression.match(
                    /^(\w+)\s*(=|>|<|>=|<=|!=)\s*(.+)$/i
                );

            if (!m)
                return [];

            const field =
                m[1];

            const op =
                m[2];

            let value =
                m[3];

            value =
                value.replace(
                    /^["']|["']$/g,
                    ""
                );

            return this.Rows._items.filter(
                r =>
                {

                    const rv =
                        r[field];

                    switch (op)
                    {

                        case "=":
                            return rv == value;

                        case "!=":
                            return rv != value;

                        case ">":
                            return rv > value;

                        case "<":
                            return rv < value;

                        case ">=":
                            return rv >= value;

                        case "<=":
                            return rv <= value;

                        default:
                            return false;
                    }
                });
        };

    DataTable.prototype.Clone =
        function ()
        {

            const dt =
                new DataTable(
                    this.TableName
                );

            this.Columns._items
                .forEach(c =>
                {

                    dt.Columns.Add(
                        c.ColumnName,
                        c.DataType,
                        {
                            AllowDBNull: c.AllowDBNull,
                            DefaultValue: c.DefaultValue,
                            Unique: c.Unique,
                            AutoIncrement: c.AutoIncrement,
                            AutoIncrementSeed: c.AutoIncrementSeed,
                            AutoIncrementStep: c.AutoIncrementStep
                        });
                });

            dt.PrimaryKey =
                this.PrimaryKey;

            return dt;
        };

    DataTable.prototype.Copy =
        function ()
        {

            const dt =
                this.Clone();

            this.Rows._items
                .forEach(r =>
                {

                    dt.ImportRow(r);
                });

            return dt;
        };

    DataTable.prototype.ToArray =
        function ()
        {

            return this.Rows._items
                .map(r => r.toObject());
        };

    DataTable.prototype.ToJSON =
        function ()
        {

            return JSON.stringify(
                this.ToArray()
            );
        };

    function validateRow(row)
    {

        const table =
            row._table;

        table.Columns._items
            .forEach(col =>
            {

                const value =
                    row[col.ColumnName];

                if (
                    !col.AllowDBNull &&
                    (value === null ||
                        value === undefined)
                )
                {
                    throw new Error(
                        "Column '" +
                        col.ColumnName +
                        "' cannot be null."
                    );
                }

                if (col.Unique)
                {

                    const duplicate =
                        table.Rows._items.some(
                            r =>
                            r[col.ColumnName] === value
                        );

                    if (duplicate)
                    {

                        throw new Error(
                            "Duplicate value in column '" +
                            col.ColumnName +
                            "'"
                        );
                    }
                }
            });
    }

    global.DataRowState =
        DataRowState;

    global.DataColumn =
        DataColumn;

    global.DataRow =
        DataRow;

    global.DataTable =
        DataTable;

})(window);