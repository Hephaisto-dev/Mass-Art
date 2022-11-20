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

import { Web3Storage, Web3File } from 'web3.storage'


const fee = 0;
const clientPrivateKey = "S1vwe5yhxWoL1QkfzFw78js4RRhin9Yo8C4wTZ7o1iQFHtNupEB";
const scAddr = "A1UtSSQ8ybvqtmSvaQtmz4Vm9UiXKTcenxMwxTYKDXeQ2uiJPh2";



// Construct with token and endpoint
const client = new Web3Storage({
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDM1MTVCOEI5ZUI4M0FGMzNCZDkzNDU2NGY5NTQ1NTE5RDVEYWQ2MGUiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2Njg4OTE4ODk5MDAsIm5hbWUiOiJtYXNzYXJ0In0.AgsZBp4tBZmKTSb1yr0K8E7dxEnhQrtd-whDtHhWbCA"
});



async function getField(key : string) : Promise<string | null> {
  let r = await web3Client.publicApi().getDatastoreEntries([{address:scAddr, key:key} as IDatastoreEntryInput]);
  if (!r[0].final) return null;
  return r[0].final;
}


var arts : any[] = [];


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
  e.innerText = arts[currentArt].percentage.toString() + " % de chance d'avoir cette Art";
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


var amount = 10;
var currentArt = 0;


function nextArt() {
  if (arts.length > 0) {
    currentArt = (currentArt + 1) % arts.length;
  }
}


async function updateArts() {
  console.log("Update arts");
  arts = await fetchArts();
  if (arts.length > 0) {
    displayPercent();
    displayAmount();
    displayImage();
  }
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
    });
  });
});



var images = [
  "https://d23.com/app/uploads/2020/01/1180w-463h_010920-riviera-art-gallery-780x440.jpg",
];
var simgsrc = images[0];



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

  web3Client.smartContracts().callSmartContract(
    {
      fee: fee,
      maxGas: 70000000,
      gasPrice: 0,
      coins: amount,
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
  });
}


function displayInPercent() {
  let v = (document.getElementById("percent") as HTMLInputElement).value;
  let e = document.getElementById("percent_display");
  if (!e) return;
  e.innerText = parseInt(v).toString() + " %";
}



async function onSendFile() {
  console.log("Start uploading file ...");
  const fileInput = document.querySelector('input[type="file"]') as any;
  if (!fileInput) return;

  // Pack files into a CAR and send to web3.storage
  const rootCid = await client.put(fileInput.files) // Promise<CIDString>

  // Get info on the Filecoin deals that the CID is stored in
  //const info = await client.status(rootCid) // Promise<Status | undefined>

  // Fetch and verify files from web3.storage
  const res = await client.get(rootCid) // Promise<Web3Response | null>
  if (!res) return;
  
  const files : Web3File[] = await res.files() // Promise<Web3File[]>
  console.log(files);
  if (files.length > 0) {
    let file : Web3File = files[0];
    simgsrc = "http://" + file.cid + ".ipfs.w3s.link";
    displaySImage();
  }
  console.log("File uploaded");
}



function main() {
  document.getElementById("claim")?.addEventListener("click", () => {
    if (arts.length > 0) {
      doTip();
      amount = 10;
      displayAmount();
    } else {
      alert("Pas d'art sur laquelle faire un don");
    }
  });

  document.getElementById("morebtn")?.addEventListener("click", () => {
    amount += 10;
    displayAmount();
  });

  document.getElementById("lessbtn")?.addEventListener("click", () => {
    if (amount > 10) amount -= 10;
    displayAmount();
  });

  document.getElementById("nextbtn")?.addEventListener("click", () => {
    nextArt();
    displayImage();
    displayPercent();
  });

  document.getElementById("addbtn")?.addEventListener("click", () => {
    addArt();
  });

  document.getElementById("percent")?.addEventListener("change", () => {
    displayInPercent();
  });

  document.getElementById("upload")?.addEventListener("click", () => {
    onSendFile();
  });
}


export default main;
