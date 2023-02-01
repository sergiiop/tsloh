export const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: (...args: any) => any,
) => {
  if (!file) return callback(new Error('File is empty'), false)

  const fileExptension = file.mimetype.split('/')[1]

  const validExtensions = ['jpg', 'jpeg', 'png', 'gif']

  if (validExtensions.includes(fileExptension)) {
    return callback(null, true)
  }
  callback(null, false)
}
