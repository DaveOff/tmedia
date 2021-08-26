var targetDetail = '*://twitter.com/i/api/graphql/*/TweetDetail*';
var targetUserTweets = '*://twitter.com/i/api/graphql/*/UserTweets*';
var targetUserMedia = '*://twitter.com/i/api/graphql/*/UserMedia*';
var targetAll = '*://twitter.com/i/api/2/notifications/all.json*';

function listener(details)
{
	let filter = browser.webRequest.filterResponseData(details.requestId);
	let decoder = new TextDecoder("utf-8");
	let encoder = new TextEncoder();
	let data = [];
	
	filter.ondata = event => {
		data.push(event.data);
	};
	filter.onstop = event => {
		const mergedUint8Array = new Uint8Array(data.map(typedArray => [...new Uint8Array(typedArray)]).flat());	
		let obj = JSON.parse(decoder.decode(mergedUint8Array, {stream: true}));
		if(obj["globalObjects"] !== undefined && obj["globalObjects"]["tweets"] !== undefined){
			for (var key in obj["globalObjects"]["tweets"]) {
			if(obj["globalObjects"]["tweets"][key]["extended_entities"] === undefined ||
				obj["globalObjects"]["tweets"][key]["extended_entities"]["media"][0]["type"] !== "video") continue;
				const max = obj["globalObjects"]["tweets"][key]["extended_entities"]["media"][0]["video_info"]["variants"]
				.filter(({content_type}) => content_type !== "application/x-mpegURL")
				.reduce(function(prev, current) {
					return (prev.bitrate > current.bitrate) ? prev : current
				});
				obj["globalObjects"]["tweets"][key]["extended_entities"]["media"][0]["video_info"]["variants"] = [max];
			}
		}
		else if(obj["data"] !== undefined && obj["data"]["user"] !== undefined){
			for (var key in obj["data"]["user"]["result"]["timeline"]["timeline"]["instructions"][0]["entries"]) {
			if(obj["data"]["user"]["result"]["timeline"]["timeline"]["instructions"][0]["entries"][key]["content"]["itemContent"] === undefined ||
				obj["data"]["user"]["result"]["timeline"]["timeline"]["instructions"][0]["entries"][key]["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["extended_entities"] === undefined ||
				obj["data"]["user"]["result"]["timeline"]["timeline"]["instructions"][0]["entries"][key]["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["extended_entities"]["media"][0]["type"] !== "video") continue;
				const max = obj["data"]["user"]["result"]["timeline"]["timeline"]["instructions"][0]["entries"][key]["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["extended_entities"]["media"][0]["video_info"]["variants"]
				.filter(({content_type}) => content_type !== "application/x-mpegURL")
				.reduce(function(prev, current) {
					return (prev.bitrate > current.bitrate) ? prev : current
				});
				obj["data"]["user"]["result"]["timeline"]["timeline"]["instructions"][0]["entries"][key]["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["extended_entities"]["media"][0]["video_info"]["variants"] = [max];
			}
		}
		else if(obj["data"] !== undefined && obj["data"]["threaded_conversation_with_injections"] !== undefined){
			const max = obj["data"]["threaded_conversation_with_injections"]["instructions"][0]["entries"][0]["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["extended_entities"]["media"][0]["video_info"]["variants"]
			.filter(({content_type}) => content_type !== "application/x-mpegURL")
			.reduce(function(prev, current) {
				return (prev.bitrate > current.bitrate) ? prev : current
			});
			obj["data"]["threaded_conversation_with_injections"]["instructions"][0]["entries"][0]["content"]["itemContent"]["tweet_results"]["result"]["legacy"]["extended_entities"]["media"][0]["video_info"]["variants"] = [max];
		}
		filter.write(encoder.encode(JSON.stringify(obj)));
		filter.disconnect();
	};
	return {};
}

browser.webRequest.onBeforeRequest.addListener(
  listener,
  {urls: [targetDetail, targetUserTweets, targetUserMedia, targetAll]},
  ["blocking"]
);
