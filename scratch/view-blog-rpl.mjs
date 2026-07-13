import mongoose from "mongoose";

async function run() {
  const uri = "mongodb+srv://RPLmarket:Quzbf6bsmXGARrw9@cluster0.e5n1hnl.mongodb.net/RPLmarket";
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  
  const blog = await db.collection("blogs").findOne({
    $or: [
      { title: /RPL/i },
      { content: /RPL/i },
      { summary: /RPL/i }
    ]
  });
  
  if (blog) {
    console.log("Title:", blog.title);
    console.log("Summary:", blog.summary);
    console.log("Content includes RPL? ", blog.content.includes("RPL"));
    
    // Find all occurrences of RPL in the content
    const regex = /RPL\s*Market/gi;
    let match;
    while ((match = regex.exec(blog.content)) !== null) {
      console.log(`Found: "${match[0]}" at index ${match.index}`);
    }
  } else {
    console.log("No blog found");
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
