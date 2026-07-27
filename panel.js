const SU = 'https://bxwxulztcencoiiqogxy.supabase.co';
const SK = 'sb_publishable_DcBleL9fOIrDT9cRn4QOfA_b5ALE3JD';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

let aT = localStorage.getItem('supabase_token');
if (!aT) {
    const u = new URLSearchParams(window.location.search);
    window.location.href = `login.html${u.get('negocio') ? '?negocio=' + u.get('negocio') : ''}`;
}

let isRefreshingToken = false;
$(document).ajaxError(function(event, jqXHR, settings, error) {
    if (jqXHR.status === 401) {
        if (settings.url.includes('/auth/v1/token')) {
            cerrarSesionYRedirigir();
            return;
        }

        if (!isRefreshingToken) {
            isRefreshingToken = true;
            const refreshToken = localStorage.getItem('supabase_refresh_token');
            
            if (!refreshToken) {
                cerrarSesionYRedirigir();
                return;
            }

            $.ajax({
                url: `${SU}/auth/v1/token?grant_type=refresh_token`,
                type: 'POST',
                headers: {
                    'apikey': SK,
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ refresh_token: refreshToken }),
                success: function(res) {
                    isRefreshingToken = false;
                    localStorage.setItem('supabase_token', res.access_token);
                    if (res.refresh_token) {
                        localStorage.setItem('supabase_refresh_token', res.refresh_token);
                    }
                    window.location.reload();
                },
                error: function() {
                    isRefreshingToken = false;
                    cerrarSesionYRedirigir();
                }
            });
        }
    }
});

function cerrarSesionYRedirigir() {
    localStorage.removeItem('supabase_token');
    localStorage.removeItem('supabase_refresh_token');
    localStorage.removeItem('cart_temp');
    const u = new URLSearchParams(window.location.search);
    window.location.href = `login.html${u.get('negocio') ? '?negocio=' + u.get('negocio') : ''}`;
}


const p2 = $(".pagina-principal"), p3 = $(".pagina-ticket"), p1 = $(".pagina-estadistica"), p4 = $(".pagina-notas");
p1.hide(); p2.show(); p3.hide(); p4.hide();

$(".btn-inicio").click(function(){
    $(".btn-inicio").removeClass("activo"); $(this).addClass("activo");
    let a = $(this).data("accion");

    p1.hide(); p2.hide(); p3.hide(); p4.hide();

    if(a == "estadistica"){ p1.show(); }
    else if(a == "inventario"){ p2.show(); }
    else if(a == "ticket"){ p3.show(); }
    else if(a == "notas"){ p4.show(); cargarNotas(); } // Cargamos las notas al entrar
});

$(".panel").hide();
let pC = true;
$(".añadir").click(function(){
    if(pC){ $(".panel").show().addClass('subirPanel'); $(this).html('<i class="fas fa-arrow-left"></i>').addClass('subir'); }
    else { $(".panel").hide().removeClass('subirPanel'); $(this).removeClass('subir').html('<i class="fas fa-plus"></i>'); }
    pC = !pC;
});

function cS(c) { return c <= 5 ? 'bajo-stock' : ''; }
function cI(a, wM, hM, c) {
    return new Promise((r, j) => {
        const l = new FileReader(); l.readAsDataURL(a);
        l.onload = e => {
            const i = new Image(); i.src = e.target.result;
            i.onload = () => {
                let w = i.width, h = i.height;
                if(w > h){ if(w > wM){ h = Math.round((h * wM) / w); w = wM; } }
                else { if(h > hM){ w = Math.round((h * hM) / h); h = hM; } }
                const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
                const cx = cv.getContext('2d');
                if(a.type === 'image/jpeg'){ cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, w, h); }
                cx.drawImage(i, 0, 0, w, h);
                cv.toBlob(b => b ? r(new File([b], a.name, { type: a.type, lastModified: Date.now() })) : j(new Error("E")), a.type, c);
            }; i.onerror = j;
        }; l.onerror = j;
    });
}

$(document).ready(function() {
    const IK = 'a6118f7c48e5f1dc450a262a80c68365', TC = 'Clientes', TV = 'Historial_Ventas';
    const SL = new URLSearchParams(window.location.search).get('negocio') || 'aromasbonitos';
    let nI = null, tP = [], ct = JSON.parse(localStorage.getItem('cart_temp')) || [], tS = {}, cC = "Todas", vT = [];

    if(ct.length > 0) { uT(); }

    function iN() {
        $.ajax({
            url: `${SU}/rest/v1/Negocios?slug=eq.${SL}&select=*`, type: 'GET',
            headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}` },
            success: d => {
                if (d.length > 0) {
                    nI = d[0].id;
                    let n = d[0];
                    if(n.color_primario) document.documentElement.style.setProperty('--color-primario', n.color_primario);
                    if(n.color_secundario) document.documentElement.style.setProperty('--color-primario-claro', n.color_secundario);
                    if(n.logo_url) $('.user-logo, .ticket-logo').attr('src', n.logo_url);
                    if(n.alias) $('.ticket-mp h4').text(n.alias);
                    
                    lP(); lE(); cargarNotas();
                }
            }
        });
    }

    function lP() {
        $.ajax({
            url: `${SU}/rest/v1/${TC}?select=id,Imagen,Nombre,Precio,Cantidad,Etiqueta,delete_url&Negocio_id=eq.${nI}`, type: 'GET',
            headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}` },
            success: p => { 
                tP = [...p.filter(x=>x.Cantidad===0), ...p.filter(x=>x.Cantidad<=5&&x.Cantidad>0), ...p.filter(x=>x.Cantidad>5)]; 
                generarCategorias(); 
                fR(); 
            }
        });
    }

    function generarCategorias() {
        let cats = ["Todas", ...new Set(tP.map(p => p.Etiqueta ? p.Etiqueta.trim() : 'General'))];
        if (!cats.includes(cC)) cC = "Todas"; 

        const cont = $('#contenedor-categorias');
        const dataList = $('#lista-categorias');
        cont.empty(); dataList.empty(); 
        
        cats.forEach(c => {
            cont.append(`<span class="categoria-item ${c === cC ? 'activa' : ''}" data-etiqueta="${c}">${c}</span>`);
            if(c !== "Todas") dataList.append(`<option value="${c}">`);
        });

        $('.categoria-item').off('click').on('click', function() {
            $('.categoria-item').removeClass('activa'); 
            $(this).addClass('activa');
            cC = $(this).data('etiqueta'); 
            fR(); 
        });
    }

    $('#buscador').on('input', fR);

    function fR() {
        let tx = $('#buscador').val().toLowerCase();
        let a = tP.filter(p => p.Nombre.toLowerCase().includes(tx));
        if(cC !== "Todas") a = a.filter(p => p.Etiqueta === cC);
        rP(a);
    }

    function rP(a) {
        $('#lista-productos').empty();
        if(!a.length) return $('#lista-productos').append('<p style="text-align:center; color:#999; margin-top:20px;">No hay productos.</p>');
        a.forEach(p => {
            let cl = p.Cantidad === 0 ? 'sin-stock' : cS(p.Cantidad);
            $('#lista-productos').append(`
                <div class="producto-item ${cl}">
                    <div class="producto-info">
                        <img src="${p.Imagen}" loading="lazy">
                        <div><strong>${p.Nombre}</strong> <b style="margin-left:5px;">${p.Etiqueta||'Gral'}</b><p style="margin:5px 0 0 0; color:#7f8c8d; font-size: 0.7rem;">$${p.Precio}</p></div>                 
                    </div>                                        
                    <div class="stock-control">
                        <div class="control"><button class="btn-sumar restar" data-id="${p.id}">-</button><p>${p.Cantidad}</p><button class="btn-sumar sumar" data-id="${p.id}">+</button></div>
                        <div class="action"><button class="btn-editar" data-id="${p.id}" style="background-color: #3498db; color: white; border: none; border-radius: 8px; width: 27px; height: 27px;"><i class="fas fa-pen" style="font-size: 0.7rem;"></i></button><button class="btn-eliminar" data-id="${p.id}"><i class="fas fa-trash"></i></button><button class="btn-eliminar check" data-id="${p.id}"><i class="fas fa-check"></i></button></div>
                    </div>
                </div>
            `);
        });
    }

    $(document).on('click', '.check', function() {
        let i = $(this).data('id'), p = tP.find(x => x.id === i);
        if(!p || p.Cantidad <= 0) return;
        p.Cantidad -= 1;
        let cI = ct.find(x => x.id === i);
        if(cI) cI.c += 1; else ct.push({ id: p.id, n: p.Nombre, p: p.Precio, c: 1 });
        fR(); uT();
        $(this).css('background-color', '#2ecc71').delay(200).queue(n => { $(this).css('background-color', 'var(--color-primario-claro)'); n(); });
    });

    function uT() {
        localStorage.setItem('cart_temp', JSON.stringify(ct)); 
        const c = $('.ticket-products'); c.empty();
        if(!ct.length) { c.append('<div class="producto-ticket"><h4>- Añade productos aqui</h4><p>$0</p></div>'); $('.ticket-total h3 span').text('$0'); cV(); return; }
        let t = 0;
        ct.forEach(i => { let s = i.p * i.c; t += s; c.append(`<div class="producto-ticket"><h4>- ${i.n} (x${i.c})</h4><p>$${s}</p></div>`); });
        let d = (t * (parseFloat($('#ticket-descuento').val()) || 0)) / 100;
        $('.ticket-total h3 span').text(`$${Math.round(t - d)}`);
        cV();
    }

    function cV() {
        let t = parseFloat($('.ticket-total h3 span').text().replace('$',''))||0;
        let p = parseFloat($('#monto-pago').val())||0;
        let v = p - t;
        $('#monto-vuelto').text(`$${v > 0 ? v : 0}`);
    }

    $('#ticket-descuento, #monto-pago').on('input', uT);
    $('#btn-borrar-ticket').click(() => { ct = []; localStorage.removeItem('cart_temp'); $('#ticket-descuento, #monto-pago').val(''); uT(); });

    $('#btn-imprimir').on('click', function() {
        if(!ct.length) return;
        $(this).prop('disabled', true).text('Guardando...');
        let tF = parseFloat($('.ticket-total h3 span').text().replace('$',''));
        $.ajax({
            url: `${SU}/rest/v1/${TV}`, type: 'POST',
            headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`, 'Content-Type': 'application/json' },
            data: JSON.stringify({ Negocio_id: nI, Total_Venta: tF, Metodo_Pago: $('#metodo-pago').val(), Detalle_Productos: ct }),
            success: () => {
                Promise.all(ct.map(i => $.ajax({
                    url: `${SU}/rest/v1/${TC}?id=eq.${i.id}`, type: 'PATCH',
                    headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`, 'Content-Type': 'application/json' },
                    data: JSON.stringify({ Cantidad: tP.find(p => p.id === i.id).Cantidad })
                }))).then(() => {
                    $('#btn-imprimir, #btn-borrar-ticket').hide();
                    html2canvas(document.querySelector('.pagina-ticket'), { backgroundColor: '#fff5e7', useCORS: true, scale: 2 }).then(cs => {
                        const a = document.createElement('a'); a.href = cs.toDataURL('image/png');
                        const h = new Date(); a.download = `ticket(${h.getDate()}-${h.getMonth()+1}).png`;
                        document.body.appendChild(a); a.click(); document.body.removeChild(a);
                        ct = []; localStorage.removeItem('cart_temp'); $('#ticket-descuento, #monto-pago').val(''); uT(); lP(); lE();
                        $('#btn-imprimir').show().prop('disabled', false).text('Descargar Ticket');
                        $('#btn-borrar-ticket').show();

                        Toast.fire({ icon: 'success', title: 'Venta registrada con éxito' });
                    });
                }).catch(() => {
                    $('#btn-imprimir').show().prop('disabled', false).text('Descargar Ticket');
                    Toast.fire({ icon: 'error', title: 'Hubo un error al actualizar el stock' });
                });
            }
        });
    });

    $('#form-producto').on('submit', async function(e) {
        e.preventDefault(); $('#btn-guardar').prop('disabled', true);
        try {
            let im = await cI($('#p-imagen')[0].files[0], 500, 500, 0.7);
            let fd = new FormData(); fd.append('image', im);
            $.ajax({
                url: `https://api.imgbb.com/1/upload?key=${IK}`, type: 'POST', data: fd, contentType: false, processData: false,
                success: r => {
                    $.ajax({
                        url: `${SU}/rest/v1/${TC}`, type: 'POST',
                        headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                        data: JSON.stringify({ Negocio_id: nI, Nombre: $('#p-nombre').val(), Precio: parseFloat($('#p-precio').val()), Cantidad: parseInt($('#p-cantidad').val()), Etiqueta: $('#p-etiqueta').val(), Imagen: r.data.url }),
                        success: d => {
                            $('#form-producto')[0].reset(); $('#btn-guardar').prop('disabled', false);
                            if(d && d.length) { tP.push(d[0]); fR(); }
                            
                            
                            Toast.fire({ icon: 'success', title: 'Producto añadido correctamente' });
                        }
                    });
                }
            });
        } catch (er) { 
            $('#btn-guardar').prop('disabled', false); 
            Toast.fire({ icon: 'error', title: 'Error al procesar la imagen' });
        }
    });

    $(document).on('click', '.btn-eliminar:not(.check)', function() {
        let i = $(this).data('id');
        Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir la eliminación de este producto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${SU}/rest/v1/${TC}?id=eq.${i}`, type: 'DELETE',
                    headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}` },
                    success: () => { 
                        tP = tP.filter(p => p.id !== i); 
                        fR(); 
                        Toast.fire({ icon: 'success', title: 'Producto eliminado' });
                    }
                });
            }
        });
    });

    $(document).on('click', '.btn-sumar', function() {
        let i = $(this).data('id'), p = tP.find(x => x.id === i);
        if(!p) return;
        p.Cantidad = Math.max(0, p.Cantidad + ($(this).hasClass('sumar') ? 1 : -1));
        fR();
        if(tS[i]) clearTimeout(tS[i]);
        tS[i] = setTimeout(() => {
            $.ajax({
                url: `${SU}/rest/v1/${TC}?id=eq.${i}`, type: 'PATCH',
                headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`, 'Content-Type': 'application/json' },
                data: JSON.stringify({ Cantidad: p.Cantidad })
            });
        }, 1000);
    });

    function lE() {
        $.ajax({
            url: `${SU}/rest/v1/${TV}?select=*&Negocio_id=eq.${nI}`, type: 'GET',
            headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}` },
            success: v => {
                let d = new Date(), fL = d.toLocaleDateString('en-CA'), m = d.getMonth(), y = d.getFullYear();
                vT = v.filter(x => new Date(x.created_at).toLocaleDateString('en-CA') === fL);
                let vM = v.filter(x => { let dx = new Date(x.created_at); return dx.getMonth() === m && dx.getFullYear() === y; });
                let t = { c:0, ef:0, mp:0, tj:0, bn:0 }, tM = 0;
                vM.forEach(x => tM += x.Total_Venta);
                vT.forEach(x => {
                    t.c += x.Total_Venta;
                    if(x.Metodo_Pago==="Efectivo") t.ef+=x.Total_Venta; else if(x.Metodo_Pago==="Mercado Pago") t.mp+=x.Total_Venta;
                    else if(x.Metodo_Pago==="Tarjeta") t.tj+=x.Total_Venta; else if(x.Metodo_Pago==="Transferencia") t.bn+=x.Total_Venta;
                });
                $('#stats-fecha').text(`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`);
                $('#stats-total').text(`$ ${t.c.toLocaleString()}`); $('#stats-cantidad').text(`Tickets de hoy: ${vT.length}`);
                $('#stats-mp').text(`$ ${t.mp.toLocaleString()}`); $('#stats-efectivo').text(`$ ${t.ef.toLocaleString()}`);
                $('#stats-tarjeta').text(`$ ${t.tj.toLocaleString()}`); $('#stats-banco').text(`$ ${t.bn.toLocaleString()}`);
                $('#stats-total-mes').text(`$ ${tM.toLocaleString()}`);
                let mN = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
                $('#stats-mes').text(mN[m]);
                
                $('#stats-historial, #stats-top-productos').empty();
                if(!vT.length) { $('#stats-historial').append('<p style="font-size:0.8rem;color:#999;">Sin tickets hoy.</p>'); $('#stats-top-productos').append('<p style="font-size:0.8rem;color:#999;">Sin ventas hoy.</p>'); return; }
                vT.forEach(x => $('#stats-historial').append(`<div style="border-bottom:1px solid #eee; padding:10px 0; display:flex; justify-content:space-between; align-items:center; font-size:0.9rem;"><span><i class="fas fa-receipt" style="color:#ccc; margin-right:5px;"></i> ${x.Metodo_Pago}</span><strong style="color:var(--color-primario);">$${x.Total_Venta}</strong></div>`));
                let c = {}; vT.forEach(x => (typeof x.Detalle_Productos==='string'?JSON.parse(x.Detalle_Productos):x.Detalle_Productos).forEach(i => c[i.n] = (c[i.n]||0) + i.c));
                Object.keys(c).map(n => ({n, c:c[n]})).sort((a,b)=>b.c-a.c).slice(0,3).forEach((p,i) => $('#stats-top-productos').append(`<div style="display:flex; justify-content:space-between; padding:5px 0;"><span><strong>#${i+1}</strong> ${p.n}</span><strong>x${p.c}</strong></div>`));
            }
        });
    }

    $('#btn-exportar-csv').click(() => {
        if(!vT.length) {
            Swal.fire({
                icon: 'info',
                title: 'Sin datos',
                text: 'No hay ventas hoy para exportar.',
                confirmButtonText: 'Entendido'
            });
            return;
        }
        let csv = "Fecha,Metodo Pago,Total\n" + vT.map(v => `${new Date(v.created_at).toLocaleString()},${v.Metodo_Pago},${v.Total_Venta}`).join('\n');
        let b = new Blob([csv], {type: 'text/csv'});
        let a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `Caja_${new Date().toLocaleDateString('en-CA')}.csv`;
        a.click();
        
        Toast.fire({ icon: 'success', title: 'Archivo CSV exportado con éxito' });
    });

    iN();

const Tabla_Notas = 'Notas'; 

function cargarNotas() {
    if(!nI) return; 

    $.ajax({
        url: `${SU}/rest/v1/${Tabla_Notas}?select=*&Negocio_id=eq.${nI}&order=fecha.desc`, 
        type: 'GET',
        headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}` },
        success: notas => {
            const cont = $('#lista-notas');
            cont.empty();
            if(!notas.length) {
                cont.append('<p style="text-align:center; color:#999; margin-top: 20px;">No tienes pendientes. ¡Todo listo!</p>');
                return;
            }
            notas.forEach(n => {
                
                let fechaFormateada = new Date(n.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
                
                cont.append(`
                    <div class="nota-item pagina-activa">
                        <div class="nota-contenido">
                            <h4>${n.titulo}</h4>
                            <p>${n.texto}</p>
                            <span class="nota-fecha"><i class="far fa-clock"></i> ${fechaFormateada}</span>
                        </div>
                        <button class="btn-eliminar check btn-completar-nota" data-id="${n.id}" style="width: 40px; height: 40px; border-radius: 50%;">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                `);
            });
        }
    });
}

$('#form-nota').on('submit', function(e) {
    e.preventDefault();
    let btn = $('#btn-guardar-nota');
    btn.prop('disabled', true).text('Guardando...');
    
    let nuevaNota = {
        Negocio_id: nI,
        titulo: $('#n-titulo').val(),
        texto: $('#n-texto').val(),
        fecha: new Date().toISOString() 
    };

    $.ajax({
        url: `${SU}/rest/v1/${Tabla_Notas}`, 
        type: 'POST',
        headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`, 'Content-Type': 'application/json' },
        data: JSON.stringify(nuevaNota),
        success: () => {
            $('#form-nota')[0].reset();
            btn.prop('disabled', false).text('Añadir Nota');
            cargarNotas();
            Toast.fire({ icon: 'success', title: 'Nota añadida' });
        },
        error: () => {
            btn.prop('disabled', false).text('Añadir Nota');
            Toast.fire({ icon: 'error', title: 'Error al añadir la nota' });
        }
    });
});

$(document).on('click', '.btn-completar-nota', function() {
    let id = $(this).data('id');
    let btn = $(this);
    btn.prop('disabled', true);
    
    $.ajax({
        url: `${SU}/rest/v1/${Tabla_Notas}?id=eq.${id}`, 
        type: 'DELETE',
        headers: { 'apikey': SK, 'Authorization': `Bearer ${localStorage.getItem('supabase_token')}` },
        success: () => { 
            btn.closest('.nota-item').fadeOut(300, function() { $(this).remove(); });
            Toast.fire({ icon: 'success', title: '¡Tarea Completada!' });
        },
        error: () => {
            btn.prop('disabled', false);
            Toast.fire({ icon: 'error', title: 'Error al borrar' });
        }
    });
});

    $(document).on('click', '.btn-editar', async function() {
    let id = $(this).data('id');
    let producto = tP.find(x => x.id === id); 

    const { value: nuevoPrecio } = await Swal.fire({
        title: 'Editar precio',
        input: 'number',
        inputLabel: `Precio actual de ${producto.Nombre}: $${producto.Precio}`,
        inputValue: producto.Precio,
        showCancelButton: true,
        confirmButtonText: 'Guardar',
        cancelButtonText: 'Cancelar'
    });

    if (nuevoPrecio && nuevoPrecio != producto.Precio) {
        $.ajax({
            url: `${SU}/rest/v1/Clientes?id=eq.${id}`, 
            type: 'PATCH',
            headers: { 
                'apikey': SK, 
                'Authorization': `Bearer ${localStorage.getItem('supabase_token')}`, 
                'Content-Type': 'application/json' 
            },
            data: JSON.stringify({ Precio: parseFloat(nuevoPrecio) }),
            success: () => {
                producto.Precio = parseFloat(nuevoPrecio);
                fR();
                Toast.fire({ icon: 'success', title: 'Precio actualizado' });
            }
        });
    }
});


});