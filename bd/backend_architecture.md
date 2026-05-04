# Backend Архитектур ба API удирдамж

Энэхүү баримт бичиг нь төслийн Backend архитектурын онцлог болон Frontend/Backend хөгжүүлэгчдэд зориулсан API ашиглах заавар юм.

---

## 1. Single API Endpoint (Нэгдсэн чиглүүлэлт)

Энэ төсөлд уламжлалт RESTful API (олон төрлийн route-үүд) ашиглахаас татгалзаж, **бүх хүсэлтийг ганц URL руу** хүлээж авах архитектурыг нэвтрүүлсэн.

*   **URL:** `POST http://localhost/api/app/process` (эсвэл серверийн хаяг)
*   **Method:** Зөвхөн `POST` ашиглана.

Ямар үйлдэл хийхийг Frontend-ээс явуулж буй **`pc` (Process Code)** гэсэн header-ээр тодорхойлно.

### Frontend хөгжүүлэгчид анхаарах:
Хүсэлт илгээх бүрдээ дараах хэлбэрээр илгээнэ:

```javascript
fetch('http://localhost/api/app/process', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'pc': 'ch0101', // Заавал байх ёстой: Process Code
        'Authorization': 'Bearer <token>' // Шаардлагатай бол
    },
    body: JSON.stringify({
        event_id: 1, // Өмнө нь URL дээр байсныг Body руу оруулсан!
        ticket_id: 123,
        device_id: "ABC"
    })
})
```

> [!WARNING]  
> Өмнө нь `events/1/checkins` гэж URL дотор `event_id` явуулдаг байсныг больсон тул, Event-тэй холбоотой бүх хүсэлтийн **Body дотор `event_id`-г заавал явуулах** шаардлагатай.

---

## 2. CRUD Үйлдэл ба Өгөгдөл устгах (Soft Delete)

Бүх хүсэлт `POST` аргаар (method) явж байгаа тул уламжлалт RESTful аргачлалууд (GET, PUT, DELETE) ашиглагдахгүй. Иймд өгөгдөл үүсгэх, унших, засах, устгах (CRUD) үйлдлүүдийг дараах байдлаар гүйцэтгэнэ:

### Frontend хөгжүүлэгчид анхаарах:
Ямар нэгэн бичлэг засах эсвэл устгахдаа тухайн бичлэгийнхээ **давтагдашгүй дугаар (unique ID)**-г заавал Body (payload) дотор явуулна.

**Жишээ нь (Хэрэглэгч устгах):**
```javascript
fetch('http://localhost/api/app/process', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'pc': 'us0104' // Жишээ нь: User delete process code
    },
    body: JSON.stringify({
        user_id: 45 // Устгах хэрэглэгчийн ID-г payload-аар явуулна
    })
})
```

### Backend хөгжүүлэгчид анхаарах:
Frontend-ээс ирсэн `user_id` гэх мэт утгаар нь баазаас шүүж олоод үйлдлээ хийнэ.
**Анхааруулга (Устгах үйлдэл):**
Өгөгдлийг баазаас шууд устгахгүй (Hard Delete хийхгүй). Оронд нь `statusid` баганын утгыг `-1` эсвэл `0` болгож өөрчлөх (Soft Delete) зарчмаар ажиллана.

**Жишээ нь (Backend дээр устгах):**
```php
public function us0104(Request $request) {
    // 1. Хэрэглэгчийг id-аар нь баазаас олох
    $user = User::findOrFail($request->user_id);
    
    // 2. Шууд устгахын оронд statusid-г -1 болгож идэвхгүй болгох
    $user->update(['statusid' => -1]);
    
    return $this->success(['message' => 'Амжилттай устгагдлаа']);
}
```

---

## 3. Dynamic Routing (Динамик чиглүүлэлт)

Backend дээр `ProcessController` нь `pc` header-ийг барьж аваад `axiom_processes` гэсэн өгөгдлийн сангийн хүснэгтээс хайлт хийдэг.

### Backend хөгжүүлэгчид анхаарах:
Шинээр API нэмэх үед `routes/api.php` файлд ямар ч өөрчлөлт орохгүй! Зөвхөн дараах 2 алхамыг хийнэ:

1.  **Controller & Method үүсгэх:**
    Жишээ нь: `App\Http\Controllers\CheckinController` дотор `ch0101` функцийг бичнэ.
2.  **Баазад бүртгэх:**
    `axiom_processes` хүснэгтэд (эсвэл Seed файл дотор) тухайн API-гаа бүртгэнэ.
    *   `process_code`: `ch0101`
    *   `controller`: `App\Http\Controllers\CheckinController`
    *   `function`: `ch0101`

Энэ бүтэц нь API-уудыг өгөгдлийн сангаас удирдах (хаах, нээх, хянах) боломжийг олгодог.

---

## 3. Оффлайн ажиллагаа & Биометрик

Төсөл нь интернэтгүй (offline) үед тасалбар баталгаажуулах зориулалттай. Үүнийг шийдэхийн тулд `SyncController` болон `SyncQueue` ашигладаг.

### Биометрик дата (Face Embeddings):
*   Хэрэглэгчийн царайг математик вектор (embedding) болгож `users` хүснэгтийн `biometric_data` (longText) талбарт хадгална.
*   **Sync:** Арга хэмжээ эхлэхээс өмнө оффлайн төхөөрөмжүүд рүү (гар утас/сканер) энэхүү `biometric_data`-г Sync хийж татаж авна.
*   **Оффлайн баталгаажуулалт:** Төхөөрөмж өөр дээрх татаж авсан датагаа ашиглан хүний царайг 1 секунд хүрэхгүй хугацаанд таньж хаалга нээнэ.

---

## 4. Алдаа боловсруулалт (Exception Handling)

Алдаа гарсан тохиолдолд систем нь `AxiomException` ашиглан нэгдсэн форматаар хариу буцаана. 

**Алдааны форматын жишээ:**
```json
{
    "success": false,
    "message": "Invalid process code: invalid_code",
    "data": []
}
```

Backend хөгжүүлэгчид бизнесийн логик алдаа гарах үед энгийн `Exception` биш `throw new AxiomException("Алдааны мессеж");` ашиглах хэрэгтэй.

---

## 5. WebSockets (Real-time дата)

Төсөл нь реал-тайм мэдэгдэл болон өгөгдөл солилцоход **Pusher** протоколыг ашигладаг. Локал хөгжүүлэлтийн орчинд үүнийг орлуулахын тулд **Soketi** (Node.js дээр суурилсан) серверийг ашиглана.

*   **Асаах команд:** Terminal дээр `npx @soketi/soketi start`
*   **Холбогдох порт:** `6001`

Frontend хөгжүүлэгчид нь `pusher-js` болон `laravel-echo` санг ашиглаж, өгөгдсөн порт болон түлхүүрээр (env дотор байгаа `devhack_key`) холбогдож реал-тайм өгөгдлийг хүлээж авна.
