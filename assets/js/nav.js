/**
 * 导航页面js
 */

// load data js txt file
let param = window.location.href.split("?")[1]
if (!param || !param.includes('=')) {
    param = 'nav'
} else {
    param = param.split("=")[1].split('#')[0]
}
const filepath = decodeURI(param)
const script = document.createElement('script')
script.src = `datas/${filepath}.txt`
const filename = getFileName(filepath)
script.onload = () => {
    loadDataSuccess(data)
    document.title = '奈未导航 - ' + filename
}
script.onerror = (err) => {
    loadDataSuccess(null)
    document.title = '奈未导航 - ' + filename
}
document.head.appendChild(script);


function loadDataSuccess(data) {
    if (!data || !data.data) {
        var data = { data: [{ title: "默认分类" }] }
    }
    if (!data.settings) {
        data.settings = { showEmptyCategory: true, crypto: false, full: false, rememberPass: false }
    }

    if (data.settings.crypto) {
        const marsk = document.querySelector('.marsk.confirm-pass')
        const input = marsk.querySelector('input[type=password]')
        marsk.querySelector('.btn-yes').addEventListener('click', function() {
            handleCrypto(input.value)
        })
        input.addEventListener('keydown', function (e) {
            if (e.key === "Enter") {
                handleCrypto(this.value)
            }
        })

        let password = null
        if (data.settings.rememberPass) {
            password = localStorage.getItem('pass_' + filepath)
        }
        if (password) {
            handleCrypto(password)
        } else {
            marsk.style.display = 'block'
            input.focus()
        }
    } else {
        vue(data)
    }
}

function handleCrypto(password) {
    if (password && password !== '') {
        const marsk = document.querySelector('.marsk.confirm-pass')
        let decryptData = null
        try {
            decryptData = JSON.parse(decrypt(data.data, password))
        } catch (error) {
            if (marsk.style.display === 'none') {
                marsk.style.display = 'block'
            }
            console.log('密码不正确')
            alert('密码不正确')
        }
        if (decryptData) {
            if (data.settings.rememberPass && marsk.style.display === 'block') {
                localStorage.setItem('pass_' + filepath, password)
            }
            marsk.style.display = 'none'
            vue(data, decryptData, password)
        }
    }
}

let editing = false
let settingsChanged = false
function vue(data, decryptData, password) {
    const { createApp, ref, reactive, toRaw } = Vue
    const { computePosition, flip, shift, offset, arrow, } = FloatingUIDOM

    handleDataKey(decryptData || data.data)
    const items = reactive(decryptData || data.data)
    const settings = reactive(data.settings)
    const editFlag = reactive({ info: false, child: false, btns: false })
    const editData = reactive({ title: '', href: '', icon: '', remark:'', description: '', i: -1, j: -1, k: -1 })
    const controlData = reactive({
        editModel: false, showMenu: false, showSettings: false, showMask: false, full: false, 
        showEmptyCategory: data.showEmptyCategory || true, crypto: data.crypto || false, password: password,
        rememberPass: data.rememberPass || false
    })
    const isShowTip = ref(false)
    const tipContent = ref('')
    let timeout = null

    if (window.screen.width < 600) {
        controlData.showMenu = false
    }

    function getCurrent(i, j, k) {
        if (!editFlag.info) {
            if (j === undefined) {
                return items[i]
            } else {
                return items[i].children[j]
            }
        } else if (editFlag.child) {
            if (j === undefined) {
                return items[i]
            } else {
                return items[i].children[j]
            }
        } else {
            if (j === undefined) {
                alert('j undefined')
            } else if (k === undefined) {
                return items[i].sites[j]
            } else {
                return items[i].children[j].sites[k]
            }
        }
    }

    function populateEditData(i, j, k) {
        let current = getCurrent(i, j, k)
        editData.title = current.title
        editData.href = current.href
        editData.icon = current.icon
        editData.remark = current.remark
        editData.description = current.description
        editData.i = i
        editData.j = j
        editData.k = k
    }

    function getNewSite() {
        if (editFlag.info) {
            return { title: editData.title, href: editData.href, icon: editData.icon, remark: editData.remark, 
                description: editData.description, key: Date.now() }
        } else {
            return { title: editData.title, key: Date.now() }
        }
    }

    const app = createApp({
        setup() {
            return {
                items,
                editFlag,
                editData,
                controlData,
                settings,
                isShowTip,
                tipContent,
                expand: function (e) {
                    const classList = e.currentTarget.parentNode.parentNode.classList
                    const expended = classList.contains('expanded')
                    document.querySelectorAll('aside>ul>li.expanded').forEach(item => item.classList.remove('expanded'))
                    if (!expended) {
                        classList.add('expanded')
                    }
                },
                editSite: function (info, child, btns, i, j, k) {
                    editFlag.info = info
                    editFlag.child = child
                    editFlag.btns = btns
                    populateEditData(i, j, k)
                    controlData.showMask = true
                },
                editUpdate: function () {
                    let current = getCurrent(editData.i, editData.j, editData.k)
                    current.title = editData.title
                    if (editFlag.info) {
                        current.href = editData.href
                        current.icon = editData.icon
                        current.remark = editData.remark
                        current.description = editData.description
                    }
                    controlData.showMask = false
                    editing = true
                },
                editDelete: function (i, j, k) {
                    if (window.confirm('确定删除？')) {
                        if (j === undefined) {
                            alert('editDelete j undefined')
                        } else if (k === undefined) {
                            items[i].sites.splice(j, 1)
                        } else {
                            items[i].children[j].sites.splice(k, 1)
                        }
                        editing = true
                    }
                },
                insertBefore: function () {
                    let newSite = getNewSite()
                    if (editFlag.info) {
                        if (editData.j === undefined) {
                            alert("insertBefore j undefined")
                        } else if (editData.k === undefined) {
                            items[editData.i].sites.splice(editData.j, 0, newSite)
                        } else {
                            items[editData.i].children[editData.j].sites.splice(editData.k, 0, newSite)
                        }
                    } else {
                        if (editData.j === undefined) {
                            items.splice(editData.i, 0, newSite)
                        } else {
                            items[editData.i].children.splice(editData.j, 0, newSite)
                        }
                    }
                    controlData.showMask = false
                    editing = true
                },
                insertAfter: function () {
                    let newSite = getNewSite()
                    if (editFlag.info) {
                        if (editData.j === undefined) {
                            alert("insertBefore j undefined")
                        } else if (editData.k === undefined) {
                            items[editData.i].sites.splice(editData.j + 1, 0, newSite)
                        } else {
                            items[editData.i].children[editData.j].sites.splice(editData.k + 1, 0, newSite)
                        }
                    } else {
                        if (editData.j === undefined) {
                            items.splice(editData.i + 1, 0, newSite)
                        } else {
                            items[editData.i].children.splice(editData.j + 1, 0, newSite)
                        }
                    }
                    controlData.showMask = false
                    editing = true
                },
                deleteMenu: function (i, j) {
                    if (window.confirm('确定删除？')) {
                        if (j === undefined) {
                            if (items.length == 1) {
                                alert('至少有一个')
                            } else {
                                items.splice(i, 1)
                            }
                        } else {
                            items[i].children.splice(j, 1)
                        }
                        editing = true
                    }
                },
                appendChild: function () {
                    let newSite = getNewSite()
                    if (editFlag.info) {
                        if (editData.j === undefined) {
                            if (!items[editData.i].sites) {
                                items[editData.i].sites = []
                            }
                            items[editData.i].sites.push(newSite)
                        } else {
                            let children = items[editData.i].children[editData.j]
                            if (!children.sites) {
                                children.sites = []
                            }
                            children.sites.push(newSite)
                        }
                    } else {
                        if (editData.j === undefined) {
                            if (!items[editData.i].children) {
                                items[editData.i].children = []
                            }
                            items[editData.i].children.push(newSite)
                        }
                    }
                    controlData.showMask = false
                    editing = true
                },
                saveData: function () {
                    if (settings.crypto && controlData.password && controlData.password.length > 0) {
                        try {
                            data.data = encrypt(JSON.stringify(toRaw(items), stringifyReplacer), controlData.password)
                        } catch (error) {
                            console.log('encrypt error', error)
                            alert('encrypt error:' + error)
                            return
                        }
                    } else {
                        data.data = toRaw(items)
                    }
                    save2Txt(filename, data)
                },
                showSettingsForm() {
                    if (!settingsChanged) {
                        if (controlData.showEmptyCategory !== settings.showEmptyCategory) {
                            controlData.showEmptyCategory = settings.showEmptyCategory
                        }
                        if (controlData.full !== settings.full) {
                            controlData.full = settings.full
                        }
                        if (controlData.crypto !== settings.crypto) {
                            controlData.crypto = settings.crypto
                        }
                        if (password !== controlData.password) {
                            controlData.password = password
                        }
                        if (controlData.password !== settings.rememberPass) {
                            controlData.rememberPass = settings.rememberPass
                        }
                        if (settings.cardWidth !== controlData.cardWidth) {
                            controlData.cardWidth = settings.cardWidth
                        }
                    }
                    controlData.showSettings = true
                },
                confirmSettings() {
                    controlData.showEmptyCategory = controlData.showEmptyCategory === true || controlData.showEmptyCategory === 'true'
                    controlData.full = controlData.full === true || controlData.full === 'true'
                    controlData.crypto = controlData.crypto === true || controlData.crypto === 'true'
                    controlData.rememberPass = controlData.rememberPass === true || controlData.rememberPass === 'true'
                    if (settings.showEmptyCategory !== controlData.showEmptyCategory) {
                        settings.showEmptyCategory = controlData.showEmptyCategory
                        settingsChanged = true
                    }
                    if (settings.full !== controlData.full) {
                        settings.full = controlData.full
                        settingsChanged = true
                    }
                    if (settings.crypto !== controlData.crypto) {
                        settings.crypto = controlData.crypto
                        settingsChanged = true
                    }
                    if (settings.crypto && password !== controlData.password) {
                        settingsChanged = true
                    }
                    if (settings.rememberPass !== controlData.rememberPass) {
                        settings.rememberPass = controlData.rememberPass
                        settingsChanged = true
                    }
                    if (settings.cardWidth !== controlData.cardWidth) {
                        settings.cardWidth = Number(controlData.cardWidth)
                        settingsChanged = true
                    }
                    controlData.showSettings = false
                },
                tooltipContent(site) {
                    return site.description ? site.description : site.remark ? site.remark : site.title
                },
                showTip(event) {
					clearTimeout(timeout)
                    const target = event.target
                    tipContent.value = target.getAttribute('tip-content')
                    isShowTip.value = true
                    const placement = target.getAttribute('tip-placement')
                    showTooltip(target, placement)
                },
                hideTip() {
					clearTimeout(timeout)
                    timeout = setTimeout(() => {
                        isShowTip.value = false
                    }, 100)
                },
                enterTooltip() {
					clearTimeout(timeout)
                    isShowTip.value = true
                },
                clickCard(site) {
                    if (site.href && site.href.length) {
                        window.open(site.href, '_blank')
                    }
                }
            }
        }
    })

    app.mount('#app')

    function showTooltip(reference, tipPlacement) {
        const tooltip = document.querySelector('#tooltip');
        const arrowElement = tooltip.querySelector('#arrow');
        computePosition(reference, tooltip, {
            placement: tipPlacement,
            middleware: [offset(6), flip(), shift({ padding: 5 }), arrow({ element: arrowElement }),],
        }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(tooltip.style, {
                left: `${x}px`,
                top: `${y}px`,
            });

            // Accessing the data
            const { x: arrowX, y: arrowY } = middlewareData.arrow;

            const staticSide = {
                top: 'bottom',
                right: 'left',
                bottom: 'top',
                left: 'right',
            }[placement.split('-')[0]];

            Object.assign(arrowElement.style, {
                left: arrowX != null ? `${arrowX}px` : '',
                top: arrowY != null ? `${arrowY}px` : '',
                right: '',
                bottom: '',
                [staticSide]: '-4px',
            });
        });
    }

    function save2Txt(filename, data) {
        let saveContent = 'var data = ' + JSON.stringify(data, stringifyReplacer, 4)
        if (navigator.userAgent.includes('Linux')) {
            filename = filename + ".txt"
        }
        saveTxt(filename, saveContent, () => {
            console.log('save file success')
            editing = false
            settingsChanged = false
        }, (e) => {
            console.log('e name', e.name)
            if ("AbortError" !== e.name) {
                console.log('Use a link download')
                const blob = new Blob([saveContent], {type: "text/plain;charset=utf-8"});
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.rel = 'noopener'
                a.href = url
                a.download = filename
                a.click()
            }
        })
    }
}

window.addEventListener('beforeunload', (event) => {
    // Cancel the event as stated by the standard.
    if (editing || settingsChanged) {
        event.preventDefault();
    }
})

function toTop() {
    document.querySelector('section').scrollTo({ top: 0 })
}

function handleDataKey(data) {
    let now = Date.now()
    for (let i = 0; i < data.length; i++) {
        data[i].key = now--

        if (data[i].sites) {
            for (let j = 0; j < data[i].sites.length; j++) {
                data[i].sites[j].key = now--
            }
        }

        if (data[i].children) {
            for (let k = 0; k < data[i].children.length; k++) {
                data[i].children[k].key = now--
                if (data[i].children[k].sites) {
                    for (let m = 0; m < data[i].children[k].sites.length; m++) {
                        data[i].children[k].sites[m].key = now--
                    }
                }
            } 
        }
    }
}

function stringifyReplacer(key, value) {
    if (key === 'key') {
        return undefined
    }
    return value
}