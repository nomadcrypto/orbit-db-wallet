const utils = require("./utils");

function getLocalStorage() {
  try {
    let temp = localStorage;
    return temp;
  } catch(e) {
    const LocalStorage = require('node-localstorage').LocalStorage;
    return new LocalStorage('./orbitwallet');
  }
}

class BlankStore {
  constructor() {
    this.items = {}
  }

  setItem (key, value) {
    this.items[key] = value
  }

  getItem (key) {
    return this.items[key]
  }
}

class DefaultStore {
  constructor(storename, autosave) {
    this.storename = storename;
    this.autosave = autosave || false;
    this.items = this._getItems();
  }

  _getStorage() {
    let localStorage = getLocalStorage();
    let localItems = localStorage.getItem(this.storename)
    let storage = (localItems)? localItems : "{}";
    return storage;
  }

  _getItems() {
    storage = this._getStorage();
    let items = JSON.parse(storage);
    return items;
  }

  setItem (key, value) {
    this.items[key] = value
    return true;
  }

  getItem (key) {
    if(key in this.items) {
      return this.items[key]
    }
    return null;
  }

  save() {
    let str = JSON.stringify(this.items)
    let localStorage = getLocalStorage();
    localStorage.setItem(this.storename, str);
  }
}


class EncryptedStore  {
  constructor(password, storename) {
    this.storename = storename;
    this.autosave = false;
    this.items = this._getItems(password);
  }

  _getStorage(password) {
    let localStorage = getLocalStorage();
    let localItems = localStorage.getItem(this.storename);
    if(localItems != null) {
      return utils.sha256PWDecrypt(password,localItems)
    } 
    return "{}";
  }

   _getItems(password) {
    let storage = this._getStorage(password);
    let items = JSON.parse(storage);
    return items;
  }

  setItem (key, value) {
    this.items[key] = value
    return true;
  }

  getItem (key) {
    if(key in this.items) {
      return this.items[key]
    }
    return null;
  }

  save(password) {
    let str = JSON.stringify(this.items)
    str = utils.sha256PWEncrypt(password,str);
    let localStorage = getLocalStorage();
    localStorage.setItem(this.storename, str);
  }

}

module.exports.BlankStore = BlankStore;
module.exports.DefaultStore = DefaultStore;
module.exports.EncryptedStore = EncryptedStore;