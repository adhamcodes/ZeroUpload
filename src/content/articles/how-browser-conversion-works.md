---
title: "How ZeroUpload Converts Files Without a Server"
description: "A look under the hood at how WebAssembly and the Canvas API let your browser convert files locally — no upload, no server, no limits."
publishDate: 2026-02-20
excerpt: "People assume converting a file needs a server. It used to. Here's the actual tech that lets your browser do it alone, with the internet off."
---

Whenever I tell someone ZeroUpload converts files without a server, the first
reaction is usually a polite "...sure it does." It's a fair instinct. For most of
the internet's life, converting a file *did* mean uploading it somewhere. But the
browser has quietly turned into a serious piece of software, and it can handle
this on its own now. No trick, just a couple of technologies doing the heavy
lifting.

## Your browser is a real computer

People think of the browser as a window for looking at websites. It's also a
runtime that can execute actual programs. Two pieces make local conversion
possible:

- **The Canvas API.** It's the browser's built-in machinery for reading,
  drawing and exporting images. We load your picture onto a canvas and write it
  back out in whatever format you asked for.
- **WebAssembly.** This one's the bigger deal. It runs fast, compiled code, the
  same kind of engine that powers desktop apps, right inside the page. That's how
  the trickier stuff happens: HEIC photos, PDFs, audio.

Both of them run on your hardware, using your processor and your memory. Not ours.
We don't have any.

## What happens when you drop a file in

1. The browser reads the file off your disk into memory.
2. The engine transforms it, start to finish, locally.
3. You get a download link for the result.

There's no fourth step where it gets sent off somewhere. Nothing to upload, queue,
store, or promise to delete later.

## Why I think this is just better

- **Privacy.** We can't leak what we never receive.
- **Speed.** No uploading, no waiting in a queue, no downloading the result back.
  It just happens.
- **No limits.** A server costs money for every file it processes, which is why
  those sites cap you and then ask for your card. Our cost per conversion is zero,
  so there's nothing to ration.
- **It keeps running even if your connection drops mid-convert** — which is the
  part I find genuinely satisfying, and the clearest proof it's all local. (You
  need internet to load the page; the actual work happens on your device.)

## The one trade-off I'll be straight about

Because the work runs on *your* device, a giant file can lean hard on a phone's
memory. A 4K video would be a bad time. That's why ZeroUpload sticks to the things
that convert cleanly in a browser, images, documents and audio, and puts sensible
limits in place on mobile so your tab doesn't fall over. I'd rather do a focused
set of things well than promise everything and crash on you.

## Go check for yourself

Open any [image converter](/image-converter), start a conversion, then kill your
internet. It'll finish anyway. That's the entire promise, and it takes about ten
seconds to confirm I'm not making it up.
