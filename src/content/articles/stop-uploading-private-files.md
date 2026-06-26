---
title: "Stop Uploading Your Private Files to Random Websites"
description: "Most online converters upload your files to their servers. Here's why that's a privacy risk — and how in-browser conversion fixes it for good."
publishDate: 2026-01-15
excerpt: "I almost sent a scan of my ID to a server I'd never heard of, just to change a file type. That's the day I started building ZeroUpload."
---

A while back I needed to convert a scanned document, so I did what anyone does
and searched for a free converter. The first handful of results were all the
same: drop your file in, watch a progress bar, "uploading...". And it stopped me
cold, because I was about to hand a scan of my ID to a server I knew nothing
about, run by a company I couldn't name, just to change a file extension.

I closed the tab. Then I went and built ZeroUpload so I'd never have to do that
again. This article is the reasoning behind it.

## Where your file actually goes

When a converter does its work "in the cloud", your file takes a trip. It gets
sent across the internet, lands on someone's server, sits on their disk while
their software chews on it, and then (you hope) gets deleted on whatever schedule
they decided.

For a meme or a cat photo, fine, nobody cares. But people run bank statements,
medical letters, signed contracts and passport scans through these things every
day. Every step of that trip is a place your data can be logged, kept around,
swept up in a breach, or used for something you never agreed to. "We delete your
files after one hour" is a sentence on a webpage. It is not a guarantee, and you
have no way to check it.

## The simplest fix is to never send it at all

The safest file is one that never moves. And it turns out your browser is already
powerful enough to do this work itself, without phoning home. Images convert
through the built-in Canvas API; heavier jobs like HEIC photos, PDFs and audio
run on WebAssembly, which is basically desktop-grade software compiled to run
inside the page.

That's all ZeroUpload is. Your file gets read straight off your disk, transformed
in your device's own memory, and handed back to you as a download. It never
touches a network.

> Here's the test I like: open the converter, then switch off your Wi-Fi. It
> still works. A tool that runs with the internet disconnected physically cannot
> be uploading anything.

## How to spot a converter that's secretly uploading

You don't have to take anyone's word for it. A few tells:

- **Turn off your internet and try it.** Works offline? It's local. Breaks? It's
  shipping your file somewhere.
- **Watch for file-size limits and queues.** Those usually mean a server is doing
  the work and someone's paying per gigabyte.
- **"Please wait while we process your file..."** Local conversion doesn't make
  you wait in line. There's no line.

## That's the whole idea

You shouldn't have to trust a stranger's deletion policy just to change a file
type. Keep your files on your machine, convert them there, and stop thinking
about it.

Try it the private way: [convert PNG to JPG](/png-to-jpg), or
[browse all the image converters](/image-converter) and pull your Wi-Fi out
halfway through. It'll keep going.
