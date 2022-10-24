import * as _ from 'underscore';
import { ApiDataWrapperBase, ApiLists } from '@plano/shared/api';
import { Meta } from '@plano/shared/api/base/meta';
import { IdBase } from './id-base';
import { ObjectWithRawData } from './object-with-raw-data';
/**
 * A wrapper class for api list data. T is the type of the object being saved by the list.
 */
export class ApiListWrapper extends ApiDataWrapperBase {
    /**
     * @param removeDestroyedItems The list wrappers automatically are "updated" when an item is removed.
     * This is not the case for externally hold lists. These lists can pass "true" so they remain valid when
     * an item was removed.
     */
    constructor(api, removeDestroyedItems, propertyName) {
        super(api);
        this.propertyName = propertyName;
        /**
         * Should destroyed items be automatically be removed from this list?
         */
        this.removeDestroyedItems = false;
        /**
         * The data in the representation seen by the user. This is used by angular repeat commands.
         * Furthermore, it is important that when this class contains wrapper classes then the wrapper objects
         * are kept and not recreated the whole time. Thus, we keep them in this list.
         *
         * Note that when implementing this list's methods we must maintain both the rawData
         * and this representation for the user.
         */
        // PLANO-18170 Mit Nils besprechen. Wieso muss man es nicht initialisieren? Der Wert entspricht doch jetzt dem Typ oder?
        this.dataUser = [];
        this.removeDestroyedItems = removeDestroyedItems && !this.containsPrimitives();
        // empty list
        this._updateRawData([true], true);
    }
    /*
    Typescript supports now defining custom iterables. So, we would not need to always write for(let item of ...iterable())
    But Unfortunately ngFor does not support it :(

    [Symbol.iterator](): Iterator<T, any, undefined> {
        return this.dataUser.values();
    }
    /*

    /**
     * Returns an Array which can be used in for-each loops.
     * Note that this returns a copy of the list.
     */
    // eslint-disable-next-line jsdoc/require-jsdoc
    iterable() {
        return this.dataUser;
    }
    /**
     * Find item in list by provided fn
     * Btw… instead of !!foo.findBy(item > item.hasFoo) you should write foo.some(item > item.hasFoo)
     */
    findBy(fn) {
        for (const item of this.dataUser) {
            if (fn(item))
                return item;
        }
        return null;
    }
    /**
     * Check if item exists in array
     */
    includes(item) {
        return this.dataUser.includes(item);
    }
    /**
     * See `Array<T>.find()`
     */
    some(predicate, thisArg) {
        // eslint-disable-next-line unicorn/no-array-method-this-argument, unicorn/no-array-callback-reference
        return this.dataUser.some(predicate, thisArg);
    }
    /**
     * See `Array<T>.every()`
     */
    every(predicate, thisArg) {
        // PLANO-18170 Mit Nils besprechen
        // eslint-disable-next-line unicorn/no-array-method-this-argument, unicorn/no-array-callback-reference
        return this.dataUser.every(predicate, thisArg);
    }
    /**
     * See `Array<T>.find()`
     */
    find(predicate) {
        // PLANO-18170 Mit Nils besprechen
        // eslint-disable-next-line unicorn/no-array-callback-reference
        const result = this.dataUser.find(predicate);
        return result !== null && result !== void 0 ? result : null;
    }
    /**
     * See `Array<T>.slice()`
     */
    slice(start, end) {
        return this.dataUser.slice(start, end);
    }
    /**
     * See `Array<T>.map()`
     */
    map(callbackfn) {
        // eslint-disable-next-line unicorn/no-array-callback-reference
        return this.dataUser.map(callbackfn);
    }
    /**
     * @returns Returns a copy of the data as an array object.
     */
    asArray() {
        return [...this.dataUser];
    }
    /**
     * @returns The id of this list which is currently always `null`.
     */
    get id() {
        // currently list have no ids.
        return null;
    }
    /**
     * Returns the item.
     * @param v The index of the item or its id.
     */
    get(v) {
        var _a;
        if (v === null)
            return null;
        // searching for id?
        if (v instanceof IdBase) {
            for (const objectWrapper of this.dataUser) {
                if (Meta.isSameId(objectWrapper.id.rawData, v.rawData)) {
                    return objectWrapper;
                }
            }
            // id was not found
            return null;
        }
        else {
            // Otherwise v is the index.
            // In case v would be outside the array range this would return "undefined". Make sure it will be "null".
            return (_a = this.dataUser[v]) !== null && _a !== void 0 ? _a : null;
        }
    }
    /**
     * Sets the value at a given index.
     * @param index The index of the item to be updated.
     * @param v New value.
     */
    set(index, v) {
        if (this.dataUser[index])
            this.onItemRemove(this.dataUser[index]);
        this.data[index + 1] = (v instanceof ObjectWithRawData) ? v.rawData : v;
        this.dataUser[index] = v;
        this.subscribeItemDestroyed(v);
        this.onItemAdded(v);
    }
    /**
     * Returns the number of items in this list.
     */
    get length() {
        return this.dataUser.length;
    }
    /**
     * Returns the first item in this list.
     */
    get first() {
        var _a;
        return (_a = this.dataUser[0]) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Returns the last item in this list.
     */
    get last() {
        var _a;
        if (this.dataUser.length === 0)
            return null;
        return (_a = this.dataUser[this.dataUser.length - 1]) !== null && _a !== void 0 ? _a : null;
    }
    /**
     * Returns an Sorted Array which can be used in for-each loops.
     * Note that this returns a copy of the list.
     * @param iteratees Name or Array of names of the attribute that should be used for sorting,
     *   last given item is the most important. If this is left undefined than the sorting criteria is
     * 	 the item itself i.e. when this is a list of numbers.
     * @param reverse Reverses the result
     */
    //  public iterableSortedBy<Iteratee = keyof T | ((item : T) => any)>(
    // 	iteratees : Iteratee | Iteratee[],
    // eslint-disable-next-line sonarjs/cognitive-complexity
    iterableSortedBy(iteratees, reverse) {
        let result = this.dataUser;
        const sortByIteratee = (iteratee) => {
            if (iteratee.includes('.')) {
                result = _.sortBy(result, (item) => {
                    let deepIteratee = item;
                    for (const iterateePart of iteratee.split('.')) {
                        deepIteratee = deepIteratee[iterateePart];
                        if (deepIteratee === undefined) {
                            // If you have a shiftmodels.iterableSortedBy(['object.property']) object can
                            // be undefined. In that case the iterable should return as it is.
                            return true;
                        }
                    }
                    return deepIteratee;
                });
                return result;
            }
            else {
                result = _.sortBy(result, (item) => {
                    const _item = item;
                    let innerIteratee = _item[iteratee];
                    if (typeof innerIteratee === 'string') {
                        innerIteratee = innerIteratee.toLowerCase();
                    }
                    return innerIteratee;
                });
                return result;
            }
        };
        if (!iteratees)
            result = _.sortBy(result);
        if (typeof iteratees === 'string') {
            result = sortByIteratee(iteratees);
        }
        if (iteratees instanceof Function)
            result = _.sortBy(result, iteratees);
        if (Array.isArray(iteratees)) {
            for (const iteratee of iteratees) {
                if (typeof iteratee === 'string') {
                    result = sortByIteratee(iteratee);
                }
                if (iteratee instanceof Function)
                    result = _.sortBy(result, iteratee);
            }
        }
        if (reverse) {
            return result.reverse();
        }
        else {
            return result;
        }
    }
    /**
     * Like Array.sort() but takes multiple compareFns
     * @param iteratees if you provide an array, set the most important iteratee at the last index.
     */
    sort(iteratees, removeDestroyedItems, reverse) {
        let items = this.iterable().reverse();
        if (reverse)
            items = items.reverse();
        for (const iteratee of iteratees) {
            items = items.sort(iteratee);
        }
        // wrap result as an api list
        const result = this.createInstance(removeDestroyedItems);
        for (const item of items) {
            result.push(item);
        }
        return result;
    }
    /**
     * Sort them
     * @param iteratees if you provide an array, set the most important iteratee at the last index.
     */
    sortedBy(iteratees, removeDestroyedItems, reverse) {
        const items = this.iterableSortedBy(iteratees, reverse);
        // wrap result as an api list
        const result = this.createInstance(removeDestroyedItems);
        for (const item of items) {
            result.push(item);
        }
        return result;
    }
    /**
     * Returns a list of list where each inner list contains the values being equal. The outer lists
     * are sorted according to the given ordering.
     * @param compareFn A compare function defining the ordering of the items. See Array.prototype.sort() for a documentation of this function. All items
     * where this method returns `0` will be put in the same group.
     * @param removeDestroyedItems removeDestroyedItems value which is used to create the inner and outer lists.
     * @param reverse Reverses the result
     */
    groupedBy(compareFn, removeDestroyedItems, reverse) {
        // override compareFn to include "reverse" parameter
        if (reverse) {
            const origCompareFn = compareFn;
            compareFn = (a, b) => {
                return -origCompareFn(a, b);
            };
        }
        // create sorted copy of items
        const items = this.dataUser.slice();
        items.sort(compareFn);
        //
        // 	Put all items with the same value in the same "group"
        //
        const result = new ApiLists(this.api, removeDestroyedItems);
        /**
         * An item of the group which we are currently processing
         */
        let currGroupItem = null;
        for (const currItem of items) {
            // current item belongs to current group?
            if (currGroupItem !== null && compareFn(currItem, currGroupItem) === 0) {
                // then add current item to current group
                result.get(result.length - 1).push(currItem);
            }
            else {
                // Otherwise create new group
                currGroupItem = currItem;
                const newGroup = this.createInstance(removeDestroyedItems);
                newGroup.push(currItem);
                result.push(newGroup);
            }
        }
        return result;
    }
    /**
     * Compare the items in this list vs the items in wrapper
     * @param wrapper - Items to be compared with
     */
    equals(wrapper) {
        // same size
        if (wrapper.length !== this.length) {
            return false;
        }
        // iteriere listen
        for (let i = 0; i < wrapper.length; i++) {
            // innere liste index i ist gleich shiftModel
            if (wrapper.get(i) !== this.get(i)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Removes the item with the index "index".
     */
    remove(index) {
        this.onItemRemove(this.dataUser[index]);
        this.data.splice(index + 1, 1);
        this.dataUser.splice(index, 1);
    }
    /**
     * Removes all items of the list.
     */
    clear() {
        for (let i = 0; i < this.dataUser.length; ++i)
            this.onItemRemove(this.dataUser[i]);
        this.data.splice(1, this.data.length - 1);
        this.dataUser = [];
    }
    /**
     * Returns the index of item "item".
     * @returns Index of item. -1 is returned if item was not found.
     */
    indexOf(item) {
        if (item instanceof IdBase) {
            for (let i = 0; i < this.dataUser.length; ++i) {
                if (this.dataUser[i].id.equals(item))
                    return i;
            }
            return -1;
        }
        else {
            return this.dataUser.indexOf(item);
        }
    }
    /**
     * Does the list contains a given item?
     * @param item The item we are looking for.
     */
    contains(item) {
        // eslint-disable-next-line unicorn/prefer-includes
        return this.indexOf(item) >= 0;
    }
    /**
     * Removes the item "item".
     */
    removeItem(item) {
        const index = this.indexOf(item);
        if (index >= 0)
            this.remove(index);
    }
    /**
     * Removes the items "items".
     */
    removeItems(items) {
        for (const item of items.dataUser) {
            this.removeItem(item);
        }
    }
    /**
     * Pushes a new item to the end of the list.
     * @param item The new item.
     */
    push(item) {
        // get raw data of new item
        const itemRaw = item instanceof ObjectWithRawData ? item.rawData : item;
        // push
        this.data.push(itemRaw);
        this.dataUser.push(item);
        this.subscribeItemDestroyed(item);
        this.onItemAdded(item);
    }
    /**
     * Inserts `item` at position `index`. It will not replace any old item. Instead it moves all previous items from that position
     * to the next index.
     * @param index The (0-based) index where the item should be inserted.
     * @param item The item to be inserted.
     */
    insert(index, item) {
        // get raw data of new item
        const itemRaw = item instanceof ObjectWithRawData ? item.rawData : item;
        // insert
        this.data.splice(index + 1, 0, itemRaw);
        this.dataUser.splice(index, 0, item);
        this.subscribeItemDestroyed(item);
        this.onItemAdded(item);
    }
    /**
     * Unshift a new item to the start of the list.
     * @param item The new item.
     */
    unshift(item) {
        // get raw data of new item
        const itemRaw = item instanceof ObjectWithRawData ? item.rawData : item;
        // push
        this.data.splice(1, 0, itemRaw);
        this.dataUser.unshift(item);
        this.subscribeItemDestroyed(item);
        this.onItemAdded(item);
    }
    subscribeItemDestroyed(item) {
        if (this.removeDestroyedItems) {
            // TODO: Not completely sure if this is correct here:
            // Currently we do not have a unsubscribe method because this would require us to hold
            // a list of all subscriptions.
            // Now, but as removed wrappers normally are also destroyed they would anyways not emit destroy event.
            // If they would, should not be a problem. Right? ;)
            // eslint-disable-next-line rxjs/no-ignored-subscription
            item.destroyed.subscribe((listItem) => {
                this.removeItem(listItem);
            });
        }
    }
    /**
     * Creates new list item and adds it to the end of the list.
     * @returns The newly created item is returned.
     */
    createNewItem() { throw new Error('Not implemented.'); }
    /**
     * This method implements the wrapping of an item.
     * Has to be implemented by inherited classes.
     * @param _item Items raw data
     * @param _generateMissingData See _updateRawData() -> generateMissingData
     */
    wrapItem(_item, _generateMissingData) { throw new Error('Not implemented.'); }
    /**
     * Handler being called after an operation which adds a new item to the list.
     */
    onItemAdded(newItem) {
        if (newItem instanceof ApiDataWrapperBase)
            newItem.parent = this;
    }
    /**
     * Handler being called before an operation which removes an item from the list.
     */
    onItemRemove(removedItem) {
        var _a;
        if (removedItem instanceof ApiDataWrapperBase)
            removedItem.parent = null;
        if (this.api)
            this.api.changed((_a = this.propertyName) !== null && _a !== void 0 ? _a : null);
    }
    /**
     * INTERNAL METHOD!
     *
     * Replaces in this list and all items ids given in `idReplacements`.
     * @param idReplacements All ids to be replaced.
     */
    _fixIds(idReplacements) {
        if (!this.data)
            return;
        if (this.containsIds()) {
            // So, we create new wrappers for each item with the replaced id.
            this.dataUser = [];
            for (let i = 1; i < this.data.length; ++i) {
                const newIdRaw = Meta.getReplacedId(this.data[i], idReplacements);
                this.data[i] = newIdRaw;
                this.dataUser.push(this.wrapItem(newIdRaw, false));
            }
        }
        else if (!this.containsPrimitives()) {
            for (let i = 0; i < this.dataUser.length; ++i) {
                this.dataUser[i]._fixIds(idReplacements);
            }
        }
    }
    // eslint-disable-next-line sonarjs/cognitive-complexity
    _updateRawData(data, generateMissingData) {
        super._updateRawData(data, generateMissingData);
        if (this.removeDestroyedItems && data && data.length > 1)
            throw new Error('This method currently does not support automatic item removal.');
        //
        // 	Updates users view
        //
        if (!data) {
            // remove all old wrappers
            if (!this.containsPrimitives() && !this.containsIds() && this.data) {
                for (const item of this.dataUser) {
                    item._updateRawData(null, false);
                    item.parent = null;
                }
            }
            this.dataUser = [];
        }
        else {
            if (this.containsIds()) {
                // We cannot call _updateRawData() for ids. See Id._updateRawData() for more info.
                // So, we create new wrappers for each item
                this.dataUser = [];
                for (let i = 1; i < data.length; ++i) {
                    const itemRaw = data[i];
                    this.dataUser.push(this.wrapItem(itemRaw, false));
                }
            }
            else if (this.containsPrimitives()) {
                // just copy data removing meta
                this.dataUser = data.slice(1);
            }
            else {
                // this list contains wrapper classes.
                const oldDataUser = this.dataUser;
                // create new list of wrapper classes
                const newDataUser = new Array();
                // methods to return index from current "oldDataUser" object.
                // Note that these methods explicitly only uses rawData and not the id wrappers
                // because they might not be up-to-date.
                const indexOf = (idRaw) => {
                    for (const [i, element] of oldDataUser.entries()) {
                        if (Meta.isSameId(idRaw, Meta.getId(element.rawData)))
                            return i;
                    }
                    return -1;
                };
                const indexOfByNewItemId = (newItemId) => {
                    for (const [i, element] of oldDataUser.entries()) {
                        if (Meta.getNewItemId(element.rawData) === newItemId)
                            return i;
                    }
                    return -1;
                };
                for (let i = 1; i < data.length; ++i) {
                    const itemRaw = data[i];
                    // is there an old wrapper?
                    const idRaw = Meta.getId(itemRaw);
                    const newItemId = Meta.getNewItemId(itemRaw);
                    let oldWrapperIndex = -1;
                    if (newItemId !== null)
                        oldWrapperIndex = indexOfByNewItemId(newItemId);
                    else
                        oldWrapperIndex = indexOf(idRaw);
                    // Note that we explicitly don’t reset newItemId to 0. This is important if a multiple api.save() command are
                    // executed (before the first backend response arrives) then resetting the newItemId would result that
                    // only for the first backend response the client would be able to find the new-item wrapper.
                    // old wrapper found!
                    if (oldWrapperIndex >= 0) {
                        // add wrapper with update raw data to new list
                        const oldWrapper = oldDataUser[oldWrapperIndex];
                        oldWrapper._updateRawData(itemRaw, generateMissingData);
                        newDataUser.push(oldWrapper);
                        // remove it from old list
                        oldDataUser.splice(oldWrapperIndex, 1);
                    }
                    else {
                        // no old wrapper was found?
                        // Then we need to create a new one
                        const newWrapper = this.wrapItem(itemRaw, generateMissingData);
                        this.onItemAdded(newWrapper);
                        newDataUser.push(newWrapper);
                    }
                }
                // all remaining wrapper objects in the old list are invalid now.
                for (const oldWrapper of oldDataUser) {
                    oldWrapper._updateRawData(null, false);
                    oldWrapper.parent = null;
                }
                // new list is final
                this.dataUser = newDataUser;
            }
        }
        //
        // 	Update raw data
        //
        this.data = data;
    }
}
//# sourceMappingURL=api-list-wrapper.js.map