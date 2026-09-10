const supabase = require('../db/supabaseClient');

class FileStorageService {
  async uploadFile(bucket, path, fileBuffer, mimeType) {
    const { data, error } = await supabase
      .storage
      .from(bucket)
      .upload(path, fileBuffer, { contentType: mimeType, upsert: true });

    if (error) throw error;
    
    const { data: publicUrlData } = supabase
      .storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  }
}

module.exports = FileStorageService;
