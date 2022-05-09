let db;

const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("new_txn", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

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

function uploadTxn() {
  const txn = db.transaction(["new_txn"], "readwrite");

  const txnObjectStore = txn.objectStore("new_txn");

  const getAll = txnObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const txn = db.transaction(["new_txn"], "readwrite");
          const txnObjectStore = txn.objectStore("new_txn");
          txnObjectStore.clear();

          alert("All saved transactions have been submitted");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener('online', uploadTxn);