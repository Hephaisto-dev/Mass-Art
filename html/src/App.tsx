import {
  ClientFactory,
  IAccount,
  DefaultProviderUrls,
  ICallData,
  IEventFilter,
  IEvent,
  Client,
  WalletClient,
  IDatastoreEntryInput
} from "@massalabs/massa-web3";
import Args from "@massalabs/massa-web3/dist/utils/arguments";

import { Web3Storage } from 'web3.storage'


const fee = 1;
const clientPrivateKey = "S1vwe5yhxWoL1QkfzFw78js4RRhin9Yo8C4wTZ7o1iQFHtNupEB";
//const scAddr = "A1UtSSQ8ybvqtmSvaQtmz4Vm9UiXKTcenxMwxTYKDXeQ2uiJPh2";
//const scAddr = "A1rsrLuouCuW2tzfta2zuX6c6bZZkUaPmGjq5f7wEPsNRLjpqYh";
const scAddr = "A12oVQwWi6dHa4HwDZ3NXzmHFNCWfitwmLGYb9ietwpfb6abj6Sb";



// Construct with token and endpoint
const client = new Web3Storage({
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDM1MTVCOEI5ZUI4M0FGMzNCZDkzNDU2NGY5NTQ1NTE5RDVEYWQ2MGUiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2Njg4OTE4ODk5MDAsIm5hbWUiOiJtYXNzYXJ0In0.AgsZBp4tBZmKTSb1yr0K8E7dxEnhQrtd-whDtHhWbCA"
});



async function getField(key : string) : Promise<string | null> {
  let r = await web3Client.publicApi().getDatastoreEntries([{address:scAddr, key:key} as IDatastoreEntryInput]);
  if (!r[0].final) return null;
  return r[0].final;
}


// Global variables
var arts : any[] = [];
var amount = 2;
var currentArt = 0;
var simgsrc = "";


async function fetchArts() {
  let maxId = parseInt(await getField("currentId") || "-1");
  let r = [];
  for (let i = 0; i <= maxId; i++) {
    let data = await getField(i.toString());
    if (data) {
      let args = new Args(data);
      let owner = args.nextString();
      let percentage = args.nextU32();
      let url = args.nextString();
      let sold = args.nextU32();
      r.push({
        owner: owner,
        percentage: percentage,
        url: url,
        sold: sold,
        id: i
      });
    }
  }
  return r;
}


function displayCount() {
  let e = document.getElementById("count");
  if (!e) return;
  e.innerText = "Art " + (currentArt+1).toString() + " / " + arts.length.toString();
}

function displayAmount() {
  let e = document.getElementById("amount");
  if (e == null) return;
  e.textContent = amount.toString();
}

function displayImage() {
  document.getElementById("preview_img")?.setAttribute("src", arts[currentArt].url);
}

function displaySImage() {
  document.getElementById("spreview_img")?.setAttribute("src", simgsrc);
}

function displayPercent() {
  let e = document.getElementById("odd");
  if (!e) return;
  e.innerText = arts[currentArt].percentage.toString() + " % de chance d'avoir cette oeuvre d'art";
}

function displayInPercent() {
  let v = (document.getElementById("percent") as HTMLInputElement).value;
  let e = document.getElementById("percent_display");
  if (!e) return;
  e.innerText = parseInt(v).toString() + " %";
}

function showLoader(show : boolean) {
  let e = document.getElementById("preview_ldr");
  if (!e) return;
  e.style.display = show ? "inline-block" : "none";
}

function showSLoader(show : boolean) {
  let e = document.getElementById("spreview_ldr");
  if (!e) return;
  e.style.display = show ? "inline-block" : "none";
}

function enableTips(enable : boolean) {
  let e = document.getElementById("rightpantop");
  if (!e) return;
  e.setAttribute("disabled", enable ? "1" : "0");
}



function printData(datas : any) {
  console.log(datas.length + " arts on the contract");
  for (let i = 0; i < datas.length; i++) {
    let data = datas[i];
    console.log(i.toString() + " :");
    console.log("  Owner : " + data.owner);
    console.log("  Percentage : " + data.percentage.toString());
    console.log("  URL : " + data.url);
    console.log("  Is sold : " + data.sold.toString());
  }
}




function nextArt() {
  if (arts.length > 0) {
    currentArt = (currentArt + 1) % (arts.length);
  }
}


async function updateArts() {
  //console.log("Update arts");
  arts = await fetchArts();
  if (arts.length > 0) {
    displayPercent();
    displayAmount();
    displayImage();
    displayCount();
    showLoader(false);
    enableTips(!arts[currentArt].sold);
  }
}


function cyclicUpdateArts() {
  updateArts().then(() => {
    setTimeout(cyclicUpdateArts, 1000);
  });
}



// Create Web3 client

var account : IAccount;
var web3Client : Client;
WalletClient.getAccountFromSecretKey(clientPrivateKey).then((a : IAccount) => {
  account = a;
  ClientFactory.createDefaultClient(
    DefaultProviderUrls.TESTNET,
    false,
    account
  ).then(function (r) {
    web3Client = r;
    console.log("Client connected");

    updateArts().then(() => {
      printData(arts);
      setTimeout(cyclicUpdateArts, 2000);
    });
  });
});



async function waitResponse(opid : string) {
  const eventsFilter = {
    start: null,
    end: null,
    original_caller_address: null,
    original_operation_id: opid,
    emitter_address: null
  } as IEventFilter;

  let r : Array<IEvent> = [];
  while (r.length == 0) {
    r = await web3Client.smartContracts().getFilteredScOutputEvents(eventsFilter);
    for (let i = 0; i < r.length; i++) {
      console.log("Get response for operation id " + opid + " :\n", r[i].data);
    }
  }
}


function doTip() {
  let args = new Args();
  args.addU32(BigInt(arts[currentArt].id));

  console.log("Transfer " + amount.toString() + " coins");
  web3Client.smartContracts().callSmartContract(
    {
      fee: fee,
      maxGas: 70000000,
      gasPrice: 0,
      coins: amount * 1000000000,
      targetAddress: scAddr,
      functionName: "draw",
      parameter: args.serialize()
    } as ICallData, account
  ).then(function (data : Array<string>) {
    console.log("Call draw");
    console.log("callSmartContract result : ", JSON.stringify(data));
    for (let i = 0; i < data.length; i++) {
      waitResponse(data[i]);
    }
  });
}


function getOwner() : string {
  let e = document.getElementById("owner");
  if (!e) return "";
  return (e as HTMLInputElement).value;
}


function getPercent() : number {
  let e = document.getElementById("percent");
  if (!e) return 0;
  let v = parseInt((e as HTMLInputElement).value);
  return Math.min(Math.max(1, v), 100);
}


function addArt() {
  return new Promise<void>((resolve, reject) => {
    let owner : string = getOwner();
    let percent : number = getPercent();
  
    console.log("Add art with:");
    console.log("  Owner : " + owner);
    console.log("  Percentage : " + percent.toString());
  
    let args = new Args();
    args.addString(owner);
    args.addU32(BigInt(percent));
    args.addString(simgsrc);
  
    web3Client.smartContracts().callSmartContract(
      {
        fee: fee,
        maxGas: 70000000,
        gasPrice: 0,
        coins: 0,
        targetAddress: scAddr,
        functionName: "add",
        parameter: args.serialize()
      } as ICallData, account
    ).then(function (data : Array<string>) {
      console.log("Call draw with args : ", args);
      console.log("callSmartContract result : ", JSON.stringify(data));
      for (let i = 0; i < data.length; i++) {
        waitResponse(data[i]).then(() => {
          updateArts();
        });
      }
      resolve();
    });
  });
}




async function sendFile() {
  console.log("Start uploading file ...");
  const fileInput = document.querySelector('input[type="file"]') as any;
  if (!fileInput) return;

  // Pack files into a CAR and send to web3.storage
  const cid = await client.put(fileInput.files) // Promise<CIDString>
  const name = fileInput.files.item(0).name;

  simgsrc = "http://" + cid + ".ipfs.w3s.link/" + name;
  displaySImage();
  console.log("File '" + name + "' uploaded with CID : " + cid);
}



function main() {
  document.getElementById("claim")?.addEventListener("click", () => {
    if (arts.length > 0) {
      doTip();
      amount = 2;
      displayAmount();
    } else {
      alert("Pas d'art sur laquelle faire un don");
    }
  });

  document.getElementById("morebtn")?.addEventListener("click", () => {
    amount += 2;
    displayAmount();
  });

  document.getElementById("lessbtn")?.addEventListener("click", () => {
    if (amount > 10) amount -= 10;
    displayAmount();
  });

  document.getElementById("nextbtn")?.addEventListener("click", () => {
    nextArt();
    if (arts.length > 0) {
      displayImage();
      displayPercent();
      displayCount();
      enableTips(!arts[currentArt].sold);
    }
  });

  document.getElementById("addbtn")?.addEventListener("click", () => {
    showSLoader(true);
    let e = document.getElementById("url") as HTMLInputElement;
    if (e && e.value) {
      simgsrc = e.value;
      displaySImage();
      addArt().then(() => {
        showSLoader(false);
      });
    } else {
      sendFile().then(() => {
        addArt().then(() => {
          showSLoader(false);
        });
      });
    }
  });

  document.getElementById("percent")?.addEventListener("change", () => {
    displayInPercent();
  });

  displayInPercent();

  showSLoader(false);
  showLoader(true);
  enableTips(false);
}


export default main;
