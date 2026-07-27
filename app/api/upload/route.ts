import { get, put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest){
  const pathname = req.nextUrl.searchParams.get('pathname');
  if(!pathname){
    return NextResponse.json({ error: 'Missing pathname'})
  }

  const result = await get(pathname, { access: 'private'});
  if(result?.statusCode !== 200) {
    return new NextResponse('Not Found', {status: 404});
  }

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'X-Content-Type-Options': 'nosniff'
    }
  })
}

export async function POST(req: NextRequest){
  const form = await req.formData();
  const file = form.get('file') as File;

  const blob = await put(`ktp/${file.name}`, file, {
    access: 'private',
  })

  return NextResponse.json({message: 'OK', blob})
}
