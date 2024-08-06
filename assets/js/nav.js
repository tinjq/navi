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
let filename = decodeURI(param)
const script = document.createElement('script')
script.src = `datas/${filename}.txt`
script.onload = () => {
    loadDataSuccess(data)
    // document.title = filename
}
script.onerror = (err) => {
    loadDataSuccess(null)
    // document.title = filename
}
document.head.appendChild(script);


function loadDataSuccess(data) {
    if (!data || !data.data) {
        var data = { data: [{ title: "默认分类" }] }
    }
    if (!data.settings) {
        data.settings = { showEmptyCategory: true, crypto: false }
    }

    if (data.settings.crypto) {
        const marsk = document.querySelector('.marsk.confirm-pass')
        marsk.style.display = 'block'
        const input = marsk.querySelector('input[type=password]')
        input.focus()
        input.addEventListener('keydown', function (e) {
            if (e.key === "Enter") {
                handlePrompt()
            }
        })
    } else {
        vue(data)
    }
}

function handlePrompt() {
    const marsk = document.querySelector('.marsk.confirm-pass')
    const password = marsk.querySelector('input[type=password]').value
    if (password && password !== '') {
        let decryptData = null
        try {
            decryptData = JSON.parse(decrypt(data.data, password))
        } catch (error) {
            console.log('密码不正确')
            alert('密码不正确')
        }
        if (decryptData) {
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

    const items = reactive(decryptData || data.data)
    const settings = reactive(data.settings)
    const editFlag = reactive({ info: false, child: false, btns: false })
    const editData = reactive({ title: '', href: '', icon: '', remark:'', description: '', i: -1, j: -1, k: -1 })
    const controlData = reactive({
        editModel: false, showMenu: false, showSettings: false, showMask: false,
        showEmptyCategory: data.showEmptyCategory || true, crypto: data.crypto || false, password: password
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
            return { title: editData.title, href: editData.href, icon: editData.icon, remark: editData.remark, description: editData.description }
        } else {
            return { title: editData.title }
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
                    const classList = e.currentTarget.parentNode.classList
                    const expended = classList.contains('expanded')
                    document.querySelectorAll('aside>ul>li.expanded').forEach(item => item.classList.remove('expanded'))
                    if (!expended) {
                        classList.add('expanded')
                    }
                },
                editSite: function (event, info, child, btns, i, j, k) {
                    editFlag.info = info
                    editFlag.child = child
                    editFlag.btns = btns
                    populateEditData(i, j, k)
                    controlData.showMask = true
                    event.stopPropagation()
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
                deleteMenu: function (event, i, j) {
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
                    event.stopPropagation()
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
                            data.data = encrypt(JSON.stringify(toRaw(items)), controlData.password)
                        } catch (error) {
                            console.log('encrypt error', error)
                            alert('encrypt error:' + error)
                            return
                        }
                    } else {
                        data.data = toRaw(items)
                    }
                    save2Txt(data)
                },
                showSettingsForm() {
                    if (!settingsChanged) {
                        if (controlData.showEmptyCategory !== settings.showEmptyCategory) {
                            controlData.showEmptyCategory = settings.showEmptyCategory
                        }
                        if (controlData.crypto !== settings.crypto) {
                            controlData.crypto = settings.crypto
                        }
                        if (password !== controlData.password) {
                            controlData.password = password
                        }
                        if (settings.cardWidth !== controlData.cardWidth) {
                            controlData.cardWidth = settings.cardWidth
                        }
                    }
                    controlData.showMask = false
                    controlData.showSettings = true
                },
                confirmSettings() {
                    controlData.showEmptyCategory = controlData.showEmptyCategory === true || controlData.showEmptyCategory === 'true'
                    controlData.crypto = controlData.crypto === true || controlData.crypto === 'true'
                    if (settings.showEmptyCategory !== controlData.showEmptyCategory) {
                        settings.showEmptyCategory = controlData.showEmptyCategory
                        settingsChanged = true
                    }
                    if (settings.crypto !== controlData.crypto) {
                        settings.crypto = controlData.crypto
                        settingsChanged = true
                    }
                    if (settings.crypto && password !== controlData.password) {
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
                    if (timeout) {
                        clearTimeout(timeout)
                    }
                    const target = event.target
                    tipContent.value = target.getAttribute('tip-content')
                    isShowTip.value = true
                    const placement = target.getAttribute('tip-placement')
                    showTooltip(target, placement)
                },
                hideTip() {
                    if (timeout) {
                        clearTimeout(timeout)
                    }
                    timeout = setTimeout(() => {
                        isShowTip.value = false
                    }, 100)
                },
                enterTooltip() {
                    if (timeout) {
                        clearTimeout(timeout)
                    }
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

    function save2Txt(data) {
        let saveContent = 'var data = ' + JSON.stringify(data, null, 4)
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