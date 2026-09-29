import './style.css';
import { createClient } from '@supabase/supabase-js';

    (function () {
        "use strict";

        // Env variables (Vercel/.env) ho to wo use hoti hain, warna neeche wali default values.
        // Publishable key public hoti hai, isliye code mein rakhna theek hai.
        var SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://ppoxtcnwluepfbwsxhzj.supabase.co";
        var SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_SI-pLOGHKAnKF5y1GLrcBw_sdKCLGZB";
        var supabaseClient = (SUPABASE_URL && SUPABASE_ANON_KEY)
            ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
            : null;

        var ADMIN_PASSWORD = "";
        var ADMIN_SESSION_KEY = "pw_admin_ok";
        // Password hata diya gaya hai: admin panel seedha khulta hai.
        function isAdminUnlocked() { return true; }

        var STARTERS = [
            { name: "Elegance Titanium", price: 45000, oldPrice: 52000, badge: "-20%", imageId: "", order: 1 },
            { name: "Luxury Classic",    price: 55000, oldPrice: 60000, badge: "NEW", imageId: "", order: 2 },
            { name: "Premium Steel",     price: 38500, oldPrice: 45000, badge: "-15%", imageId: "", order: 3 },
            { name: "Elite Collection",  price: 65000, oldPrice: 75000, badge: "FEATURED", imageId: "", order: 4 }
        ];

        var grid = document.getElementById("productsGrid");
        var overlay = document.getElementById("adminOverlay");
        var openBtn = document.getElementById("adminOpen");
        var msgEl = document.getElementById("adminMsg");
        var itemsEl = document.getElementById("adminItems");
        var seedBtn = document.getElementById("adminSeed");
        var saveBtn = document.getElementById("adminSave");
        var cancelBtn = document.getElementById("adminCancel");
        var formTitle = document.getElementById("formTitle");
        var fileInput = document.getElementById("adminFile");
        var dropEl = document.getElementById("adminDrop");
        var thumbEl = document.getElementById("adminThumb");
        var fName = document.getElementById("fName");
        var fPrice = document.getElementById("fPrice");
        var fOld = document.getElementById("fOld");
        var fBadge = document.getElementById("fBadge");

        var products = [];
        var editingId = null;
        var pendingImageId = "";

        /* ---------- admin tabs ---------- */
        var tabBtnEls = document.querySelectorAll(".admin-tab-btn");
        var tabPanelEls = document.querySelectorAll(".admin-tab-panel");
        var tabOrdersBtn = document.getElementById("tabOrdersBtn");
        function activateAdminTab(tab) {
            Array.prototype.forEach.call(tabBtnEls, function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === tab); });
            Array.prototype.forEach.call(tabPanelEls, function (p) { p.classList.toggle("active", p.getAttribute("data-panel") === tab); });
        }
        Array.prototype.forEach.call(tabBtnEls, function (btn) {
            btn.addEventListener("click", function () { activateAdminTab(btn.getAttribute("data-tab")); });
        });

        function money(n) {
            return "PKR " + Number(n || 0).toLocaleString("en-US");
        }
        function esc(str) {
            return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
                return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
            });
        }
        function imgSrc(id) {
            if (!id) return "";
            if (/^https?:\/\//i.test(id)) return id;
            return "/_blob/" + id;
        }

        function say(text, kind) {
            msgEl.textContent = text;
            msgEl.className = "admin-msg show " + (kind || "ok");
            if (kind !== "err") {
                setTimeout(function () { msgEl.className = "admin-msg"; }, 3500);
            }
        }

        /* ---------- storefront rendering ---------- */
        function renderGrid() {
            if (!products.length) {
                grid.innerHTML = '<div class="products-empty">No watches in the collection yet.</div>';
                return;
            }
            grid.innerHTML = products.map(function (p) {
                var pic = p.imageId
                    ? '<img src="' + esc(imgSrc(p.imageId)) + '" alt="' + esc(p.name) + '">'
                    : "<span>&#8986;</span>";
                var badge = p.badge ? '<span class="product-badge">' + esc(p.badge) + "</span>" : "";
                var oldp = p.oldPrice ? '<span class="old-price">' + esc(money(p.oldPrice)) + "</span>" : "";
                return '<div class="product-card">' +
                    '<div class="product-image">' + pic + badge + "</div>" +
                    '<div class="product-info">' +
                    '<div class="product-name">' + esc(p.name) + "</div>" +
                    '<div class="product-price">' + esc(money(p.price)) + oldp + "</div>" +
                    '<div class="product-actions"><button data-cart="' + esc(p.id) + '">Add to Cart</button><button data-order="' + esc(p.id) + '">Order Now</button></div>' +
                    "</div></div>";
            }).join("");
        }


        /* ---------- hero slideshow ---------- */
        var heroSection = document.getElementById("home");
        var heroImg = document.getElementById("heroImg");
        var heroTitle = document.getElementById("heroTitle");
        var heroDesc = document.getElementById("heroDesc");
        var heroPrice = document.getElementById("heroPrice");
        var heroTag = document.getElementById("heroTag");
        var heroDots = document.getElementById("heroDots");
        var DEFAULT_HERO = heroImg.getAttribute("src");
        var heroIndex = 0;
        var heroTimer = null;
        var heroPaused = false;

        function accentLast(name) {
            var parts = String(name).trim().split(/\s+/);
            if (parts.length < 2) return '<span class="accent">' + esc(name) + "</span>";
            var last = parts.pop();
            return esc(parts.join(" ")) + ' <span class="accent">' + esc(last) + "</span>";
        }

        function paintHero(i) {
            var p = products[i];
            if (!p) return;
            heroTitle.innerHTML = accentLast(p.name);
            heroDesc.textContent = "Part of the Prestige Wear collection \u2014 crafted for style, confidence and timeless elegance.";
            heroTag.textContent = p.badge || "";
            heroPrice.innerHTML = esc(money(p.price)) +
                (p.oldPrice ? '<span class="was">' + esc(money(p.oldPrice)) + "</span>" : "");
            heroImg.src = p.imageId ? imgSrc(p.imageId) : DEFAULT_HERO;
            heroImg.alt = p.name;
            Array.prototype.forEach.call(heroDots.children, function (b, n) {
                b.className = n === i ? "active" : "";
            });
        }

        function goHero(i) {
            if (!products.length) return;
            heroIndex = (i + products.length) % products.length;
            heroSection.classList.add("hero-fade");
            setTimeout(function () {
                paintHero(heroIndex);
                heroSection.classList.remove("hero-fade");
            }, 500);
        }

        function renderHero() {
            if (heroTimer) { clearInterval(heroTimer); heroTimer = null; }
            if (!products.length) { heroDots.innerHTML = ""; return; }
            heroDots.innerHTML = products.map(function (p, i) {
                return '<button aria-label="Show ' + esc(p.name) + '" data-slide="' + i + '"></button>';
            }).join("");
            if (heroIndex >= products.length) heroIndex = 0;
            paintHero(heroIndex);
            if (products.length > 1) {
                heroTimer = setInterval(function () {
                    if (!heroPaused && !document.hidden) goHero(heroIndex + 1);
                }, 3000);
            }
        }

        heroDots.addEventListener("click", function (e) {
            var n = e.target.getAttribute && e.target.getAttribute("data-slide");
            if (n !== null && n !== undefined) goHero(parseInt(n, 10));
        });
        heroSection.addEventListener("mouseenter", function () { heroPaused = true; });
        heroSection.addEventListener("mouseleave", function () { heroPaused = false; });

        /* ---------- admin list ---------- */
        function renderAdminList() {
            seedBtn.style.display = products.length ? "none" : "block";
            if (!products.length) {
                itemsEl.innerHTML = '<p style="color:#999;font-size:0.9rem;">Nothing saved yet.</p>';
                return;
            }
            itemsEl.innerHTML = products.map(function (p) {
                var pic = p.imageId
                    ? '<img class="admin-item-img" src="' + esc(imgSrc(p.imageId)) + '" alt="">'
                    : '<div class="admin-item-img">&#8986;</div>';
                return '<div class="admin-item">' + pic +
                    '<div class="admin-item-main"><strong>' + esc(p.name) + "</strong>" +
                    "<span>" + esc(money(p.price)) + (p.badge ? " &middot; " + esc(p.badge) : "") + "</span></div>" +
                    '<button data-edit="' + esc(p.id) + '">Edit</button>' +
                    '<button class="danger" data-del="' + esc(p.id) + '">Delete</button></div>';
            }).join("");
        }

        itemsEl.addEventListener("click", function (e) {
            var ed = e.target.getAttribute && e.target.getAttribute("data-edit");
            var del = e.target.getAttribute && e.target.getAttribute("data-del");
            if (ed) startEdit(ed);
            if (del) removeProduct(del);
        });

        /* ---------- form ---------- */
        function resetForm() {
            editingId = null;
            pendingImageId = "";
            formTitle.textContent = "Add New Product";
            saveBtn.textContent = "Save Product";
            cancelBtn.style.display = "none";
            fName.value = ""; fPrice.value = ""; fOld.value = ""; fBadge.value = "";
            thumbEl.style.display = "none";
            thumbEl.removeAttribute("src");
            dropEl.textContent = "Click to upload product picture (JPG, PNG, WebP \u2014 max 20 MB)";
        }

        function startEdit(id) {
            var p = products.filter(function (x) { return x.id === id; })[0];
            if (!p) return;
            editingId = id;
            pendingImageId = p.imageId || "";
            formTitle.textContent = "Edit: " + p.name;
            saveBtn.textContent = "Update Product";
            cancelBtn.style.display = "block";
            fName.value = p.name || "";
            fPrice.value = p.price || "";
            fOld.value = p.oldPrice || "";
            fBadge.value = p.badge || "";
            if (pendingImageId) {
                thumbEl.src = imgSrc(pendingImageId);
                thumbEl.style.display = "block";
            } else {
                thumbEl.style.display = "none";
            }
            document.querySelector(".admin-panel").scrollTop = 0;
        }

        cancelBtn.addEventListener("click", resetForm);

        dropEl.addEventListener("click", function () { fileInput.click(); });

        fileInput.addEventListener("change", function () {
            var file = fileInput.files && fileInput.files[0];
            if (!file) return;
            if (!supabaseClient) { say("Image upload is not available on this view.", "err"); return; }
            if (file.size > 20 * 1024 * 1024) { say("That image is over 20 MB.", "err"); return; }
            dropEl.textContent = "Uploading\u2026";
            var path = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + "-" + file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
            supabaseClient.storage.from("product-images").upload(path, file).then(function (res) {
                if (res.error) throw res.error;
                var pub = supabaseClient.storage.from("product-images").getPublicUrl(path);
                pendingImageId = (pub && pub.data && pub.data.publicUrl) || "";
                thumbEl.src = pendingImageId;
                thumbEl.style.display = "block";
                dropEl.textContent = "Picture uploaded \u2014 click to replace";
                say("Picture uploaded.");
            }).catch(function (err) {
                dropEl.textContent = "Click to upload product picture";
                say("Upload failed: " + ((err && err.message) || "make sure the 'product-images' storage bucket exists and is public"), "err");
            }).finally(function () { fileInput.value = ""; });
        });

        saveBtn.addEventListener("click", function () {
            if (!supabaseClient) { say("The catalog store is not available on this view.", "err"); return; }
            var name = fName.value.trim();
            var price = parseFloat(fPrice.value);
            if (!name) { say("Please enter a product name.", "err"); return; }
            if (!(price >= 0)) { say("Please enter a valid price.", "err"); return; }
            var body = {
                name: name,
                price: price,
                old_price: fOld.value ? parseFloat(fOld.value) : 0,
                badge: fBadge.value.trim(),
                image_url: pendingImageId || "",
                sort_order: editingId
                    ? (products.filter(function (x) { return x.id === editingId; })[0] || {}).order || Date.now()
                    : Date.now()
            };
            saveBtn.disabled = true;
            var req = editingId
                ? supabaseClient.from("products").update(body).eq("id", editingId)
                : supabaseClient.from("products").insert([body]);
            req.then(function (res) {
                if (res.error) throw res.error;
                say(editingId ? "Product updated." : "Product added.");
                resetForm();
                loadProducts();
            }).catch(function (err) {
                say("Could not save: " + ((err && err.message) || "no permission"), "err");
            }).finally(function () { saveBtn.disabled = false; });
        });

        function removeProduct(id) {
            var p = products.filter(function (x) { return x.id === id; })[0];
            showConfirm("Delete \u201C" + (p ? p.name : "this product") + "\u201D?", function () {
                doRemoveProduct(id);
            });
        }
        function doRemoveProduct(id) {
            // Remove from what's on screen right away, so it disappears immediately.
            products = products.filter(function (x) { return x.id !== id; });
            renderAdminList();
            renderGrid();
            renderHero();
            if (editingId === id) resetForm();

            // Starter products only ever existed in the browser, not in the database.
            if (!supabaseClient || (id && id.indexOf("starter-") === 0)) {
                say("Product deleted.");
                return;
            }
            supabaseClient.from("products").delete().eq("id", id).then(function (res) {
                if (res.error) throw res.error;
                say("Product deleted.");
            }).catch(function (err) {
                say("Could not delete: " + ((err && err.message) || "no permission"), "err");
            });
        }

        seedBtn.addEventListener("click", function () {
            if (!supabaseClient) return;
            seedBtn.disabled = true;
            var rows = STARTERS.map(function (p) {
                return { name: p.name, price: p.price, old_price: p.oldPrice, badge: p.badge, image_url: "", sort_order: p.order };
            });
            supabaseClient.from("products").insert(rows).then(function (res) {
                if (res.error) throw res.error;
                say("Starter watches imported.");
                loadProducts();
            }).catch(function (err) { say("Import failed: " + ((err && err.message) || ""), "err"); })
                .finally(function () { seedBtn.disabled = false; });
        });

        /* ---------- orders ---------- */
        var orderOverlay = document.getElementById("orderOverlay");
        var oProduct = document.getElementById("oProduct");
        var oName = document.getElementById("oName"), oPhone = document.getElementById("oPhone"),
            oPhone2 = document.getElementById("oPhone2"), oEmail = document.getElementById("oEmail"),
            oAddr = document.getElementById("oAddr"), oNear = document.getElementById("oNear"),
            oSubmit = document.getElementById("oSubmit");
        var toastEl = document.getElementById("toast"), toastTimer = null;
        var toastCheckEl = document.getElementById("toastCheck"), toastMsgEl = document.getElementById("toastMsg");
        var ordersEl = document.getElementById("adminOrders");
        var orderProduct = null, isAdmin = false, ordersOn = false, isCartCheckout = false;

        /* ---------- cart ---------- */
        var cart = [];
        try {
            var savedCart = JSON.parse(localStorage.getItem("pw_cart") || "[]");
            if (Array.isArray(savedCart)) cart = savedCart;
        } catch (e) {}
        var cartOverlay = document.getElementById("cartOverlay");
        var cartItemsEl = document.getElementById("cartItems");
        var cartTotalEl = document.getElementById("cartTotal");
        var cartCheckoutBtn = document.getElementById("cartCheckout");
        var cartOpenBtn = document.getElementById("cartOpenBtn");
        var cartCloseBtn = document.getElementById("cartClose");
        var cartBadgeEl = document.getElementById("cartBadge");

        function saveCart() {
            try { localStorage.setItem("pw_cart", JSON.stringify(cart)); } catch (e) {}
        }
        function cartQtyTotal() {
            return cart.reduce(function (s, it) { return s + it.qty; }, 0);
        }
        function updateCartBadge() {
            if (cartBadgeEl) cartBadgeEl.textContent = cartQtyTotal();
        }
        function renderCart() {
            if (!cart.length) {
                cartItemsEl.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
                cartTotalEl.textContent = money(0);
                cartCheckoutBtn.disabled = true;
                return;
            }
            var total = 0;
            cartItemsEl.innerHTML = cart.map(function (it) {
                total += it.price * it.qty;
                var pic = it.imageId ? '<img class="cart-item-img" src="' + esc(imgSrc(it.imageId)) + '" alt="' + esc(it.name) + '">' : '<div class="cart-item-img">&#8986;</div>';
                return '<div class="cart-item">' + pic +
                    '<div class="cart-item-main"><strong>' + esc(it.name) + '</strong><span>' + esc(money(it.price)) + ' each</span></div>' +
                    '<div class="cart-qty"><button data-dec="' + esc(it.id) + '">&minus;</button><span>' + it.qty + '</span><button data-inc="' + esc(it.id) + '">+</button></div>' +
                    '<button class="cart-remove" data-remove="' + esc(it.id) + '">Remove</button>' +
                    '</div>';
            }).join("");
            cartTotalEl.textContent = money(total);
            cartCheckoutBtn.disabled = false;
        }
        updateCartBadge();

        cartOpenBtn.addEventListener("click", function (e) {
            e.preventDefault();
            renderCart();
            cartOverlay.classList.add("open");
        });
        cartCloseBtn.addEventListener("click", function () { cartOverlay.classList.remove("open"); });
        cartOverlay.addEventListener("click", function (e) { if (e.target === cartOverlay) cartOverlay.classList.remove("open"); });
        cartItemsEl.addEventListener("click", function (e) {
            var inc = e.target.getAttribute && e.target.getAttribute("data-inc");
            var dec = e.target.getAttribute && e.target.getAttribute("data-dec");
            var rem = e.target.getAttribute && e.target.getAttribute("data-remove");
            if (inc) {
                var itInc = cart.filter(function (x) { return x.id === inc; })[0];
                if (itInc) itInc.qty++;
            } else if (dec) {
                var itDec = cart.filter(function (x) { return x.id === dec; })[0];
                if (itDec) { itDec.qty--; if (itDec.qty <= 0) cart = cart.filter(function (x) { return x.id !== dec; }); }
            } else if (rem) {
                cart = cart.filter(function (x) { return x.id !== rem; });
            } else { return; }
            saveCart();
            updateCartBadge();
            renderCart();
        });

        function toast(text, kind) {
            toastMsgEl.textContent = text;
            toastCheckEl.innerHTML = kind === "err" ? "&times;" : "&#10003;";
            toastEl.className = "toast show" + (kind === "err" ? " err" : "");
            clearTimeout(toastTimer);
            toastTimer = setTimeout(function () { toastEl.className = "toast"; }, 3500);
        }
        function closeOrder() { orderOverlay.classList.remove("open"); }

        grid.addEventListener("click", function (e) {
            var orderId = e.target.getAttribute && e.target.getAttribute("data-order");
            if (orderId) {
                orderProduct = products.filter(function (x) { return x.id === orderId; })[0];
                if (!orderProduct) return;
                isCartCheckout = false;
                oProduct.textContent = orderProduct.name + " \u2014 " + money(orderProduct.price);
                orderOverlay.classList.add("open");
                oName.focus();
                return;
            }
            var cartId = e.target.getAttribute && e.target.getAttribute("data-cart");
            if (cartId) {
                var cp = products.filter(function (x) { return x.id === cartId; })[0];
                if (!cp) return;
                var existing = cart.filter(function (it) { return it.id === cartId; })[0];
                if (existing) { existing.qty++; }
                else { cart.push({ id: cp.id, name: cp.name, price: cp.price, imageId: cp.imageId, qty: 1 }); }
                saveCart();
                updateCartBadge();
                renderCart();
                toast(cp.name + " added to cart!");
            }
        });
        cartCheckoutBtn.addEventListener("click", function () {
            if (!cart.length) return;
            isCartCheckout = true;
            orderProduct = null;
            var total = cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
            var itemsSummary = cart.map(function (it) { return it.name + " x" + it.qty; }).join(", ");
            oProduct.textContent = itemsSummary + " \u2014 Total: " + money(total);
            cartOverlay.classList.remove("open");
            orderOverlay.classList.add("open");
            oName.focus();
        });
        document.getElementById("oCancel").addEventListener("click", closeOrder);
        orderOverlay.addEventListener("click", function (e) { if (e.target === orderOverlay) closeOrder(); });

        oSubmit.addEventListener("click", function () {
            var name = oName.value.trim(), phone = oPhone.value.trim(), addr = oAddr.value.trim();
            if (!name || !phone || !addr) { toast("Please fill name, mobile number and address.", "err"); return; }
            if (!supabaseClient) { toast("Sorry, order could not be placed right now.", "err"); return; }
            oSubmit.disabled = true;
            var orderRow;
            if (isCartCheckout) {
                var total = cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
                orderRow = {
                    name: name, phone: phone, phone2: oPhone2.value.trim(), email: oEmail.value.trim(),
                    address: addr, near: oNear.value.trim(),
                    product: cart.map(function (it) { return it.name + " x" + it.qty; }).join(", "),
                    price: total
                };
            } else {
                orderRow = {
                    name: name, phone: phone, phone2: oPhone2.value.trim(), email: oEmail.value.trim(),
                    address: addr, near: oNear.value.trim(), product: orderProduct ? orderProduct.name : "",
                    price: orderProduct ? orderProduct.price : 0
                };
            }

            supabaseClient.from("orders").insert([orderRow]).then(function (res) {
                if (res.error) {
                    toast("Order could not be placed. Please try again.", "err");
                    oSubmit.disabled = false;
                    return;
                }
                closeOrder();
                oName.value = oPhone.value = oPhone2.value = oEmail.value = oAddr.value = oNear.value = "";
                if (isCartCheckout) { cart = []; saveCart(); updateCartBadge(); renderCart(); }
                isCartCheckout = false;
                toast("Thanks for your order! We will contact you soon.");
                oSubmit.disabled = false;
            }).catch(function () {
                toast("Order could not be placed. Please try again.", "err");
                oSubmit.disabled = false;
            });
        });

        var lastSeen = 0, prevCount = -1, curOrders = [];
        try { lastSeen = parseInt(localStorage.getItem("pw_orders_seen") || "0", 10) || 0; } catch (e) {}
        function updateBadge() {
            var n = curOrders.filter(function (o) { return (o.createdAt || 0) > lastSeen; }).length;
            openBtn.innerHTML = "&#9881;" + (n ? '<span class="admin-badge">' + n + '</span>' : "");
            if (tabOrdersBtn) {
                tabOrdersBtn.innerHTML = "Orders" + (n ? ' <span style="background:#D4AF37;color:#1a1a1a;border-radius:10px;padding:0.1rem 0.5rem;font-size:0.75rem;margin-left:0.3rem;">' + n + '</span>' : "");
            }
        }
        function markOrdersSeen() {
            lastSeen = Date.now();
            try { localStorage.setItem("pw_orders_seen", String(lastSeen)); } catch (e) {}
            updateBadge();
        }
        if (tabOrdersBtn) {
            tabOrdersBtn.addEventListener("click", function () { setTimeout(markOrdersSeen, 1200); });
        }

        function renderOrders(list) {
            document.getElementById("orderCount").textContent = list.length;
            if (!list.length) { ordersEl.innerHTML = '<p style="color:#999;font-size:0.9rem;">No orders yet.</p>'; return; }
            ordersEl.innerHTML = list.map(function (o) {
                return '<div class="order-card"' + ((o.createdAt || 0) > lastSeen ? ' style="border-color:#D4AF37;background:#fffbee"' : '') + '><div class="oc-head"><strong>' + esc(o.name) +
                    ((o.createdAt || 0) > lastSeen ? ' <span style="background:#D4AF37;color:#1a1a1a;border-radius:4px;padding:0 6px;font-size:0.7rem;">NEW</span>' : '') + '</strong>' +
                    '<span class="oc-time">' + esc(new Date(o.createdAt || 0).toLocaleString()) + '</span></div>' +
                    '<div class="oc-prod">' + esc(o.product) + ' &middot; ' + esc(money(o.price)) + '</div>' +
                    '<div>&#128241; ' + esc(o.phone) + (o.phone2 ? ' / ' + esc(o.phone2) : '') + '</div>' +
                    (o.email ? '<div>&#9993; ' + esc(o.email) + '</div>' : '') +
                    '<div>&#128205; ' + esc(o.address) + '</div>' +
                    (o.near ? '<div>&#128506; ' + esc(o.near) + '</div>' : '') +
                    '<button data-delorder="' + esc(o.id) + '">Delete</button></div>';
            }).join("");
        }
        ordersEl.addEventListener("click", function (e) {
            var id = e.target.getAttribute && e.target.getAttribute("data-delorder");
            if (!id || !supabaseClient) return;
            showConfirm("Delete this order?", function () {
                supabaseClient.from("orders").delete().eq("id", id).then(function (res) {
                    if (res.error) say("Could not delete order.", "err");
                }).catch(function () { say("Could not delete order.", "err"); });
            });
        });
        var supabaseOrdersChannel = null;
        function loadOrders() {
            if (!supabaseClient) return;
            supabaseClient.from("orders").select("*").order("created_at", { ascending: false }).then(function (res) {
                if (res.error) {
                    console.error("orders load failed", res.error);
                    ordersEl.innerHTML = '<p style="color:#a33;font-size:0.9rem;">Orders could not be loaded. Please reopen the page.</p>';
                    return;
                }
                curOrders = (res.data || []).map(function (o) {
                    return {
                        id: o.id, name: o.name, phone: o.phone, phone2: o.phone2, email: o.email,
                        address: o.address, near: o.near, product: o.product, price: o.price,
                        createdAt: o.created_at ? new Date(o.created_at).getTime() : 0
                    };
                });
                if (prevCount >= 0 && curOrders.length > prevCount) {
                    toast("New order from " + (curOrders[0].name || "a customer") + "!");
                }
                prevCount = curOrders.length;
                renderOrders(curOrders);
                updateBadge();
            });
        }
        function startOrders() {
            if (!supabaseClient || ordersOn) return;
            ordersOn = true;
            loadOrders();
            supabaseOrdersChannel = supabaseClient
                .channel("orders-changes")
                .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, function () { loadOrders(); })
                .subscribe();
        }
        startOrders();

        /* ---------- chatbot ---------- */
        var chatWin = document.getElementById("chatWin"), chatLog = document.getElementById("chatLog"),
            chatText = document.getElementById("chatText");

        function addMsg(html, who) {
            var d = document.createElement("div");
            d.className = "msg " + who;
            d.innerHTML = html;
            chatLog.appendChild(d);
            chatLog.scrollTop = chatLog.scrollHeight;
        }
        function botReply(q) {
            var t = q.toLowerCase();
            var hit = products.filter(function (p) { return t.indexOf(String(p.name).toLowerCase()) !== -1; })[0];
            if (hit) {
                return "<b>" + esc(hit.name) + "</b><br>Price: " + esc(money(hit.price)) +
                    (hit.oldPrice ? " (pehle " + esc(money(hit.oldPrice)) + ")" : "") +
                    "<br>Order karne ke liye is watch par <b>Order Now</b> dabayein.";
            }
            if (/deliver|shipping|ship|pakistan|city|shehar|shahar|courier|cod|cash/.test(t)) {
                return "Ji haan! &#127477;&#127472; Hum <b>poore Pakistan</b> me delivery karte hain. Cash on delivery bhi available hai.";
            }
            if (/price|prices|rate|qeemat|kimat|kitne|kitna|cost|pkr/.test(t)) {
                if (!products.length) return "Abhi koi watch listed nahi hai.";
                return "<b>Price list:</b><br>" + products.map(function (p) {
                    return esc(p.name) + " &mdash; " + esc(money(p.price));
                }).join("<br>");
            }
            if (/item|items|list|watch|watches|collection|product|products|available|kya hai/.test(t)) {
                if (!products.length) return "Abhi koi watch listed nahi hai.";
                return "<b>Hamari watches:</b><br>" + products.map(function (p) {
                    return "&#8986; " + esc(p.name);
                }).join("<br>") + "<br>Kisi ki price poochne ke liye us ka naam likhein.";
            }
            if (/order|buy|khareed|purchase|kaise/.test(t)) {
                return "Order karna asaan hai: apni pasand ki watch par <b>Order Now</b> dabayein, naam, mobile number aur address bharein, aur <b>Confirm Order</b> dabayein. Hum aap se rabta karenge.";
            }
            if (/\b(hi|hello|salam|assalam|hey)\b/.test(t)) {
                return "Assalam o Alaikum! Main price, watch list aur delivery ke bare me bata sakta hoon.";
            }
            return "Maaf kijiye, main yeh nahi samajh saka. Aap <b>price</b>, <b>watch list</b>, <b>delivery</b> ya <b>order</b> ke bare me pooch sakte hain.";
        }
        function ask(q) {
            q = q.trim();
            if (!q) return;
            addMsg(esc(q), "me");
            setTimeout(function () { addMsg(botReply(q), "bot"); }, 300);
        }
        function openChat() {
            chatWin.classList.add("open");
            if (!chatLog.children.length) addMsg("Assalam o Alaikum! Prestige Wear me khush aamdeed. Aap price, watch list ya delivery ke bare me pooch sakte hain.", "bot");
            chatText.focus();
        }
        document.getElementById("chatFab").addEventListener("click", function () {
            if (chatWin.classList.contains("open")) chatWin.classList.remove("open"); else openChat();
        });
        document.getElementById("chatClose").addEventListener("click", function () { chatWin.classList.remove("open"); });
        document.getElementById("chatChips").addEventListener("click", function (e) {
            if (e.target.tagName === "BUTTON") ask(e.target.textContent);
        });
        document.getElementById("chatSend").addEventListener("click", function () { ask(chatText.value); chatText.value = ""; });
        chatText.addEventListener("keydown", function (e) {
            if (e.key === "Enter") { ask(chatText.value); chatText.value = ""; }
        });

        /* ---------- panel open/close ---------- */
        var passOverlay = document.getElementById("passOverlay");
        var passInput = document.getElementById("passInput");
        var passMsg = document.getElementById("passMsg");
        var passSubmit = document.getElementById("passSubmit");
        var passCancel = document.getElementById("passCancel");

        function openAdminPanel() {
            overlay.classList.add("open");
            var hasNew = curOrders.some(function (o) { return (o.createdAt || 0) > lastSeen; });
            activateAdminTab(hasNew ? "orders" : "products");
        }
        function showPasswordModal() {
            passMsg.textContent = "";
            passInput.value = "";
            passOverlay.classList.add("open");
            setTimeout(function () { passInput.focus(); }, 50);
        }
        function tryUnlock() {
            if (passInput.value === ADMIN_PASSWORD) {
                try { sessionStorage.setItem(ADMIN_SESSION_KEY, "1"); } catch (e) {}
                passOverlay.classList.remove("open");
                openAdminPanel();
            } else {
                passMsg.textContent = "Incorrect password.";
                passInput.value = "";
                passInput.focus();
            }
        }
        passSubmit.addEventListener("click", tryUnlock);
        passCancel.addEventListener("click", function () { passOverlay.classList.remove("open"); });
        passOverlay.addEventListener("click", function (e) { if (e.target === passOverlay) passOverlay.classList.remove("open"); });
        passInput.addEventListener("keydown", function (e) { if (e.key === "Enter") tryUnlock(); });

        var confirmOverlay = document.getElementById("confirmOverlay");
        var confirmTitle = document.getElementById("confirmTitle");
        var confirmOk = document.getElementById("confirmOk");
        var confirmCancel = document.getElementById("confirmCancel");
        var confirmCb = null;
        function showConfirm(message, cb) {
            confirmTitle.textContent = message;
            confirmCb = cb;
            confirmOverlay.classList.add("open");
        }
        confirmOk.addEventListener("click", function () {
            confirmOverlay.classList.remove("open");
            var cb = confirmCb; confirmCb = null;
            if (cb) cb();
        });
        confirmCancel.addEventListener("click", function () { confirmOverlay.classList.remove("open"); confirmCb = null; });
        confirmOverlay.addEventListener("click", function (e) { if (e.target === confirmOverlay) { confirmOverlay.classList.remove("open"); confirmCb = null; } });

        openBtn.addEventListener("click", function () {
            if (isAdminUnlocked()) { openAdminPanel(); return; }
            showPasswordModal();
        });
        document.getElementById("adminClose").addEventListener("click", function () { overlay.classList.remove("open"); });
        overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.classList.remove("open"); });
        document.addEventListener("keydown", function (e) {
            if (e.key === "Escape") {
                overlay.classList.remove("open");
                passOverlay.classList.remove("open");
                confirmOverlay.classList.remove("open");
            }
        });

        /* ---------- startup ---------- */
        products = STARTERS.map(function (p, i) {
            var c = Object.assign({}, p); c.id = "starter-" + i; return c;
        });
        renderGrid();
        renderHero();

        // Admin panel is available to everyone behind the password prompt above.
        openBtn.style.display = "flex";

        var productsChannel = null;
        function loadProducts() {
            if (!supabaseClient) return;
            supabaseClient.from("products").select("*").order("sort_order", { ascending: true }).then(function (res) {
                if (res.error) { console.error("products load failed", res.error); return; }
                var rows = res.data || [];
                if (!rows.length) return; // keep showing starter watches until real products exist
                products = rows.map(function (data) {
                    return {
                        id: data.id,
                        name: data.name || "Untitled",
                        price: data.price || 0,
                        oldPrice: data.old_price || 0,
                        badge: data.badge || "",
                        imageId: data.image_url || "",
                        order: data.sort_order || 0
                    };
                });
                renderGrid();
                renderHero();
                renderAdminList();
            });
        }
        if (supabaseClient) {
            loadProducts();
            productsChannel = supabaseClient
                .channel("products-changes")
                .on("postgres_changes", { event: "*", schema: "public", table: "products" }, function () { loadProducts(); })
                .subscribe();
        }
    })();
