/*!
 * DateTime.js - C#-like DateTime implementation in JavaScript
 */
(function (root)
{
    'use strict';

    // Constantes de ticks (1 tick = 100 nanosecondes = 1/10 milliseconde)
    // Epoch C# (01/01/0001) vs Epoch Unix (01/01/1970) = 621355968000000000 ticks
    var TICKS_PER_MILLISECOND = 10000;
    var TICKS_PER_SECOND = TICKS_PER_MILLISECOND * 1000;
    var TICKS_PER_MINUTE = TICKS_PER_SECOND * 60;
    var TICKS_PER_HOUR = TICKS_PER_MINUTE * 60;
    var TICKS_PER_DAY = TICKS_PER_HOUR * 24;
    var UNIX_EPOCH_TICKS = 621355968000000000;

    function DateTime(year, month, day, hour, minute, second, millisecond)
    {
        if (year instanceof Date)
        {
            this._date = new Date(year.getTime());
        } else if (year instanceof DateTime)
        {
            this._date = new Date(year._date.getTime());
        } else if (typeof year === 'number' && month === undefined)
        {
            // Si un seul nombre est passé, on peut considérer que ce sont des ticks (ou timestamp JS selon l'usage)
            // Pour coller à C# (new DateTime(ticks)), gérons les ticks si le nombre est très grand
            if (year > 100000000000000)
            {
                var unixMs = (year - UNIX_EPOCH_TICKS) / TICKS_PER_MILLISECOND;
                this._date = new Date(unixMs);
            } else
            {
                this._date = new Date(year);
            }
        } else
        {
            var y = year !== undefined ? year : 1;
            var m = month !== undefined ? month - 1 : 0; // Mois JS de 0 à 11
            var d = day !== undefined ? day : 1;
            var h = hour !== undefined ? hour : 0;
            var min = minute !== undefined ? minute : 0;
            var s = second !== undefined ? second : 0;
            var ms = millisecond !== undefined ? millisecond : 0;

            this._date = new Date(y, m, d, h, min, s, ms);
            if (y >= 0 && y < 100)
            {
                this._date.setFullYear(y); // Gérer les années 0-99 correctement
            }
        }
    }

    // Propriétés statiques (Getters style C#)
    Object.defineProperty(DateTime, 'Now', {
        get: function () { return new DateTime(new Date()); }
    });

    Object.defineProperty(DateTime, 'UtcNow', {
        get: function ()
        {
            var d = new Date();
            return new DateTime(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
        }
    });

    Object.defineProperty(DateTime, 'Today', {
        get: function ()
        {
            var d = new Date();
            return new DateTime(d.getFullYear(), d.getMonth() + 1, d.getDate());
        }
    });

    // Propriétés d'instance
    DateTime.prototype = {
        get year() { return this._date.getFullYear(); },
        get month() { return this._date.getMonth() + 1; },
        get day() { return this._date.getDate(); },
        get hour() { return this._date.getHours(); },
        get minute() { return this._date.getMinutes(); },
        get second() { return this._date.getSeconds(); },
        get millisecond() { return this._date.getMilliseconds(); },
        get dayOfWeek() { return this._date.getDay(); }, // 0 = Dimanche, 6 = Samedi

        get dayOfYear()
        {
            var start = new Date(this.year, 0, 1);
            var diff = this._date - start;
            return Math.floor(diff / TICKS_PER_DAY) + 1;
        },

        get ticks()
        {
            var unixMs = this._date.getTime();
            return UNIX_EPOCH_TICKS + (unixMs * TICKS_PER_MILLISECOND);
        },

        get date()
        {
            return new DateTime(this.year, this.month, this.day);
        },

        get timeOfDay()
        {
            return (this.hour * TICKS_PER_HOUR) + (this.minute * TICKS_PER_MINUTE) + (this.second * TICKS_PER_SECOND) + (this.millisecond * TICKS_PER_MILLISECOND);
        },

        // Méthodes d'ajout (renvoient une nouvelle instance)
        addDays: function (value)
        {
            var d = new Date(this._date.getTime());
            d.setDate(d.getDate() + value);
            return new DateTime(d);
        },

        addMonths: function (value)
        {
            var d = new Date(this._date.getTime());
            d.setMonth(d.getMonth() + value);
            return new DateTime(d);
        },

        addYears: function (value)
        {
            var d = new Date(this._date.getTime());
            d.setFullYear(d.getFullYear() + value);
            return new DateTime(d);
        },

        addHours: function (value)
        {
            var d = new Date(this._date.getTime());
            d.setTime(d.getTime() + (value * 3600000));
            return new DateTime(d);
        },

        addMinutes: function (value)
        {
            var d = new Date(this._date.getTime());
            d.setTime(d.getTime() + (value * 60000));
            return new DateTime(d);
        },

        addSeconds: function (value)
        {
            var d = new Date(this._date.getTime());
            d.setTime(d.getTime() + (value * 1000));
            return new DateTime(d);
        },

        addMilliseconds: function (value)
        {
            var d = new Date(this._date.getTime());
            d.setTime(d.getTime() + value);
            return new DateTime(d);
        },

        // Comparaisons et formats
        compareTo: function (other)
        {
            var t1 = this._date.getTime();
            var t2 = other instanceof DateTime ? other._date.getTime() : new Date(other).getTime();
            if (t1 < t2) return -1;
            if (t1 > t2) return 1;
            return 0;
        },

        equals: function (other)
        {
            if (!(other instanceof DateTime)) return false;
            return this._date.getTime() === other._date.getTime();
        },

        toString: function (format)
        {
            var y = this.year;
            var m = String(this.month).padStart(2, '0');
            var d = String(this.day).padStart(2, '0');
            var h = String(this.hour).padStart(2, '0');
            var min = String(this.minute).padStart(2, '0');
            var s = String(this.second).padStart(2, '0');

            if (format === 'yyyy-MM-dd') return `${y}-${m}-${d}`;
            if (format === 'dd/MM/yyyy') return `${d}/${m}/${y}`;
            if (format === 'HH:mm:ss') return `${h}:${min}:${s}`;

            // Format par défaut style C# (ShortDate + ShortTime)
            return `${d}/${m}/${y} ${h}:${min}:${s}`;
        },

        toDate: function ()
        {
            return new Date(this._date.getTime());
        }
    };

    // Méthodes statiques utilitaires
    DateTime.isLeapYear = function (year)
    {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    };

    DateTime.daysInMonth = function (year, month)
    {
        return new Date(year, month, 0).getDate();
    };

    root.DateTime = DateTime;
    if (typeof module !== 'undefined' && module.exports) module.exports = DateTime;
})(typeof window !== 'undefined' ? window : this);