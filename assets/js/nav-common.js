async function saveTxt(filename, saveContent, successCallback, errorCallback) {
    try {
        const opts = {
            types: [
                {
                    accept: { "text/plain": [".txt"] }
                }
            ],
            suggestedName: filename
        }

        const handle = await window.showSaveFilePicker(opts);
        const writable = await handle.createWritable();

        await writable.write(saveContent)
        await writable.close()

        if (successCallback) {
            successCallback()
        } else {
            saveSuccess()
        }
    } catch (error) {
        if (errorCallback) {
            errorCallback(error)
        } else {
            saveError(error)
        }
    }
}

function saveSuccess() {
    console.log('save file success')
}

function saveError(error) {
    console.error('save file faild:', error)
    window.alert("save file faild:" + error)
}

function getFileName(filepath) {
    let slashIndex = Math.max(filepath.lastIndexOf('/'), filepath.lastIndexOf('\\'))
    let dotIndex = filepath.lastIndexOf('.')
    return filepath.substring(slashIndex + 1, dotIndex < 0 ? filepath.length : dotIndex)
}

function encrypt(msg, key) {
    return CryptoJS.AES.encrypt(msg, key).toString()
}

function decrypt(msg, key) {
    return CryptoJS.AES.decrypt(msg, key).toString(CryptoJS.enc.Utf8)
}