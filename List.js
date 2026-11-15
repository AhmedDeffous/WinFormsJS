(function (root) {
    'use strict';
class List {
    constructor(initialItems = [])
    {
        this._items = [];

        // If initialized with an array (e.g., from fetch API response)
        if (Array.isArray(initialItems)) {
            this._items = [...initialItems];
        }

        // Return a Proxy to enable C#-style bracket indexing: x[0]
        return new Proxy(this, {
            get(target, prop) {
                // If accessing a numeric index like x[0], x[1], etc.
                if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                    return target._items[Number(prop)];
                }
                // Otherwise return normal properties/methods (Count, Add, etc.)
                const value = target[prop];
                return typeof value === 'function' ? value.bind(target) : value;
            },
            set(target, prop, value) {
                // Allow setting via index: x[0] = newMagasin
                if (typeof prop === 'string' && /^\d+$/.test(prop)) {
                    target._items[Number(prop)] = value;
                    return true;
                }
                target[prop] = value;
                return true;
            }
        });
    }

    // 1. C#-style Count property
    get Count() {
        return this._items.length;
    }

    // 2. C#-style Add method
    Add(item) {
        this._items.push(item);
    }

    // 3. Optional: RemoveAt method
    RemoveAt(index) {
        if (index >= 0 && index < this._items.length) {
            this._items.splice(index, 1);
        }
    }

    // 4. Optional: Allow for...of loops (like C# foreach)
    [Symbol.iterator]() {
        return this._items[Symbol.iterator]();
    }
}
    // Exportation globale pour le navigateur ou l'environnement modulaire
    root.List = List;

})(typeof window !== 'undefined' ? window : global);