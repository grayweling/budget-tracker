const indexedDB = 
    window.indexedDB || 
    window.mozIndexedDB || 
    window.webkitIndexedDB || 
    window.msIndexedDB ||
    window.shimIndexedDB;

let db;
const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
  let db = event.target.result;
  db.createObjectStore("new_txn", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  //check if app is online before reading from db
  if (navigator.onLine) {
    uploadTxn();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const txn = db.transaction(["new_txn"], "readwrite");
  const txnObjectStore = txn.objectStore("new_txn");

  txnObjectStore.add(record);
}
//when online this happens
function uploadTxn() {
  const txn = db.transaction(["new_txn"], "readwrite");
  const txnObjectStore = txn.objectStore("new_txn");
  const getAll = txnObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
            return response.json();
        })
        .then(() => {
            //delete records if successful
            const txn = db.transaction(["new_txn"], "readwrite");
            const txnObjectStore = txn.objectStore("new_txn");
            txnObjectStore.clear();
        })
    }
  };
}

//listen for app coming back online
window.addEventListener('online', uploadTxn);