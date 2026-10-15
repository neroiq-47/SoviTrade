import os,json,base64,struct,time,urllib.request
RPC=f"https://mainnet.helius-rpc.com/?api-key={os.environ['HELIUS_API_KEY']}"
accs={"AAPL(Equity.US)":"DJ2FyTgUAkEtXW3U5P9PF19meFTRtW4ZWKKFgACfVbUy","AAPLx(Crypto)":"Gs4DVtiGSJ9LJvXaQFjYp6vhLNK2QsH4qWox2ck1kuMp","BTC":"4cSM2e6rvbGQUFiJbqytoVMi5GgghSMr8LwVrT9VPSPo"}
req={"jsonrpc":"2.0","id":1,"method":"getMultipleAccounts","params":[list(accs.values()),{"encoding":"base64"}]}
r=json.load(urllib.request.urlopen(urllib.request.Request(RPC,json.dumps(req).encode(),{"Content-Type":"application/json"})))
for (n,a),v in zip(accs.items(),r["result"]["value"]):
  if not v: print(n,a,"NO ACCOUNT");continue
  d=base64.b64decode(v["data"][0]);o=40
  o+= 2 if d[o]==0 else 1
  fid=d[o:o+32].hex();o+=32
  p,c,e,t=struct.unpack_from("<qQiq",d,o)
  print(n,a,"price",p*10**e,"conf",c*10**e,"age_s",int(time.time())-t,"owner",v["owner"][:6])
