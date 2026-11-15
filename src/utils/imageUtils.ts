import { supabase } from '../lib/supabase'

export interface ImageValidationResult {
  valid: boolean
  error?: string
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file: File, maxSizeBytes: number = 2 * 1024 * 1024): ImageValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato não suportado. Utilize JPG, PNG, WEBP ou GIF.'
    }
  }

  if (file.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(0)
    return {
      valid: false,
      error: `O arquivo deve ter no máximo ${maxMB}MB.`
    }
  }

  return { valid: true }
}

/**
 * Redimensiona a imagem no cliente antes do upload (economiza banda e storage do Supabase)
 * GIFs não são redimensionados para preservar frames animados.
 */
export async function optimizeImage(file: File, maxWidth: number = 800, maxHeight: number = 800): Promise<Blob> {
  if (file.type === 'image/gif') {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else {
          width = Math.round((width * maxHeight) / height)
          height = maxHeight
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            resolve(file)
          }
        },
        'image/webp',
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

/**
 * Upload seguro para o Supabase Storage
 */
export async function uploadImageToStorage(
  file: File,
  bucket: 'avatars' | 'covers' | 'attachments',
  userId: string,
  maxWidth: number = 800,
  maxHeight: number = 800
): Promise<{ url: string | null; error: string | null }> {
  try {
    const validation = validateImageFile(file, bucket === 'covers' ? 5 * 1024 * 1024 : 2 * 1024 * 1024)
    if (!validation.valid) {
      return { url: null, error: validation.error || 'Arquivo inválido' }
    }

    const optimizedBlob = await optimizeImage(file, maxWidth, maxHeight)
    const ext = file.type === 'image/gif' ? 'gif' : 'webp'
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, optimizedBlob, {
        contentType: file.type === 'image/gif' ? 'image/gif' : 'image/webp',
        upsert: false,
      })

    if (uploadError) {
      return { url: null, error: uploadError.message }
    }

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
    return { url: publicUrlData.publicUrl, error: null }
  } catch (err: any) {
    return { url: null, error: err.message || 'Erro ao realizar upload' }
  }
}
