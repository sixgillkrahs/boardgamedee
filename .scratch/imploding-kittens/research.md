# Research: Exploding Kittens & Imploding Kittens (+ Streaking, Barking, Zombie Expansions)

**Primary Sources:**
- Exploding Kittens LLC Official Rulebook (*Exploding Kittens Core Deck*)
- *Imploding Kittens* First Expansion Official Rulebook (20 Cards + Cone of Shame)
- *Streaking Kittens* Second Expansion Official Rulebook (15 Cards)
- *Barking Kittens* Third Expansion Official Rulebook (20 Cards + Tower of Power)
- *Zombie Kittens* / *Recipes for Disaster* Official Rulebooks

---

## 1. Thiết lập Ván Đấu Chuẩn (Core + Imploding Kittens Setup, 2–6 Người Chơi)

1. **Tách Bom & Tháo Ngòi**: Tạm tách tất cả các lá **Exploding Kitten**, **Imploding Kitten**, và **Defuse** ra khỏi bộ bài.
2. **Chia lá Defuse**: Phát cho mỗi người chơi **1 lá Defuse** cầm trên tay.
   - Bỏ lại vào bộ bài rút thêm một số lá Defuse dư (2 người chơi: trộn thêm 2 Defuse; 3–6 người chơi: trộn thêm tối đa 2 Defuse dư).
3. **Chia Bài Khởi Đầu**: Xáo toàn bộ các lá hành động & lá Mèo còn lại, chia cho mỗi người **7 lá** → Mỗi người bắt đầu với **8 lá trên tay** (7 lá rút + 1 Defuse). *(Nếu chơi có lá `Streaking Kitten`, được phép có thêm 1 bom trong bộ bài).*
4. **Trộn Bom vào Bộ Bài Rút (Draw Pile)**:
   - Với $N$ người chơi:
     - Nếu chơi chế độ **Imploding Kittens chuẩn**: Đưa vào bộ bài **$(N - 2)$ lá Exploding Kitten** + **1 lá Imploding Kitten** (tổng số bom = $N - 1$).
     - Nếu bật thêm lá **Streaking Kitten** (cho phép giữ 1 Exploding Kitten trên tay không nổ): Cộng thêm **+1 lá Exploding Kitten** vào bộ bài rút (tổng số bom = $N$).
   - Xáo kỹ **Draw Pile** và đặt úp giữa bàn.
   - Chiều đánh mặc định: **Theo chiều kim đồng hồ (`direction = 1`)** (hiển thị bằng vòng hướng đi **Cone of Shame**).

---

## 2. Cấu trúc Lượt Chơi (Turn Structure)

Trong lượt của mình (mặc định `turnsRemaining = 1`, hoặc nhiều hơn nếu bị `Attack` / `Targeted Attack` / `Personal Attack`):
1. **Giai đoạn Đánh Bài (Pass or Play — Tùy chọn, không giới hạn số lần)**:
   - Người chơi có thể đánh **0, 1 hoặc nhiều lá bài / Combo** từ trên tay.
   - Mỗi lá bài hoặc Combo khi đánh ra có thể bị chặn bởi lá **Nope** (hoặc chuỗi **Nope → Yup → Nope...**).
2. **Giai đoạn Rút Bài Kết Thúc Lượt (End Turn by Drawing)**:
   - Trừ khi vừa đánh một lá bài cho phép kết thúc lượt mà không cần rút (`Skip`, `Super Skip`, `Reverse`, `Attack`, `Targeted Attack`, `Catomic Bomb`, `Bury`), người chơi phải **Rút 1 lá trên cùng của Draw Pile** để kết thúc 1 lượt (`turnsRemaining - 1`).
   - Nếu `turnsRemaining > 0`, người chơi phải tiếp tục thực hiện lượt tiếp theo của mình. Khi `turnsRemaining === 0`, lượt chuyển sang người kế tiếp theo chiều `direction`.

---

## 3. Cơ chế Nổ, Tháo Ngòi (Defuse) & Mèo Hố Đen (Imploding Kitten)

### A. Exploding Kitten (Mèo Nổ)
- Khi rút phải **Exploding Kitten**:
  1. **Nếu trên tay có lá `Streaking Kitten`** (và trên tay chưa giữ lá Exploding Kitten nào khác): Người chơi có thể chọn **Giữ kín Exploding Kitten trên tay** mà không bị nổ và không tốn Defuse! *(Nhưng nếu sau đó bị đối thủ cướp mất lá `Streaking Kitten` khi vẫn còn giữ Exploding Kitten trên tay, người chơi đó lập tức phải Defuse hoặc nổ!).*
  2. **Nếu có lá `Defuse`**: Đánh lá `Defuse` vào Discard Pile, sau đó **bí mật nhét lại lá Exploding Kitten vào bất kỳ vị trí nào trong Draw Pile** (từ đỉnh `0` xuống đáy `drawPile.length`).
  3. **Nếu không có `Defuse`**: Người chơi **BỊ NỔ (Eliminated)**, bỏ toàn bộ bài xuống và rời ván đấu.

### B. Imploding Kitten (Mèo Sập Hố Đen — Không thể Defuse!)
- Lá **Imploding Kitten** có 2 trạng thái trong Draw Pile: **Úp (`faceUp: false`)** và **Ngửa (`faceUp: true`)**:
  1. **Lần đầu tiên được rút ra (khi đang Úp `faceUp: false`)**:
     - Người rút **KHÔNG bị nổ** và không cần dùng Defuse.
     - Người rút được **bí mật chọn bất kỳ vị trí nào trong Draw Pile để nhét lá Imploding Kitten vào ở trạng thái LẬT NGỬA (`faceUp: true`)**!
  2. **Khi lá Imploding Kitten nằm ở Đỉnh Draw Pile (`topCard.faceUp === true`)**:
     - Toàn bộ người chơi trên bàn đều nhìn thấy mặt ngửa của **Imploding Kitten** đang nằm ngay trên đỉnh chồng bài rút!
  3. **Lần thứ hai được rút ra (khi đã Lật Ngửa `faceUp: true`)**:
     - **KHÔNG THỂ DEFUSE** (và `Streaking Kitten` cũng không giữ được Imploding Kitten đang ngửa!).
     - Người rút bị **Hút vào Hố Đen (Imploded)** và bị loại ngay lập tức!

---

## 4. Toàn bộ Danh mục Lá Bài Cơ Bản & Mở Rộng (Base + Expansions)

### Nhóm 1: Bộ Cơ Bản (Exploding Kittens Core)
- **Exploding Kitten (Mèo Nổ)**: Rút phải là nổ trừ khi dùng `Defuse` (hoặc giữ bằng `Streaking Kitten`).
- **Defuse (Tháo Ngòi)**: Hóa giải `Exploding Kitten` và bí mật cài lại bom vào vị trí bất kỳ trong Draw Pile.
- **Nope (Phủ Quyết)**: Đánh bất cứ lúc nào để hủy bỏ hành động hoặc Combo vừa đánh của người khác (trừ `Exploding Kitten`, `Imploding Kitten`, `Defuse`, `Barking Kitten`). Đánh chồng `Nope` thứ 2 biến thành **Yup**!
- **Attack (Tấn Công 2x)**: Kết thúc ngay toàn bộ lượt hiện tại mà không cần rút bài; ép người kế tiếp theo chiều đi phải đi **2 lượt** (nếu bản thân đang bị phạt $K$ lượt từ một Attack trước đó, số lượt dồn sang người kế tiếp là **$K + 2$ lượt**!).
- **Skip (Bỏ Lượt)**: Kết thúc ngay **1 lượt** hiện tại mà không cần rút bài (nếu đang nợ 2 lượt từ Attack thì giảm xuống còn 1 lượt).
- **Favor (Xin Xỏ)**: Chọn 1 người chơi còn sống; người đó buộc phải tự chọn 1 lá bài trên tay họ đưa cho bạn.
- **Shuffle (Xáo Bài)**: Xáo trộn ngẫu nhiên toàn bộ Draw Pile (nhưng vẫn giữ nguyên trạng thái `faceUp` của lá `Imploding Kitten` nếu nó đã lật ngửa!).
- **See the Future (3x) (Thấu Thị 3 Lá)**: Bí mật xem trước 3 lá trên cùng của Draw Pile.
- **5 Lá Mèo Thường (Cat Cards)**: `Tacocat`, `Catermelon`, `Hairy Potato Cat`, `Beard Cat`, `Rainbow-Ralphing Cat` (dùng để ghép Combo 2 lá, 3 lá, hoặc 5 lá khác nhau).

### Nhóm 2: Bản Mở Rộng *Imploding Kittens*
- **Imploding Kitten (Mèo Hố Đen)**: Lần 1 rút ra thì nhét lại ở trạng thái **Lật Ngửa** vào vị trí tùy chọn; lần 2 rút phải khi đang Ngửa thì nổ ngay, không thể Defuse.
- **Feral Cat (Mèo Hoang — Wildcard)**: Đóng vai trò **Wildcard (Đại diện cho bất kỳ Lá Mèo nào)** khi ghép Combo 2 lá cùng loại hoặc 3 lá cùng loại!
- **Reverse (Đảo Chiều)**: Đảo ngược chiều vòng chơi (Kim đồng hồ $\leftrightarrow$ Ngược kim đồng hồ) VÀ kết thúc 1 lượt hiện tại mà không cần rút bài (giống `Skip` + đảo chiều).
- **Draw from the Bottom (Rút Từ Đáy)**: Kết thúc 1 lượt hiện tại bằng cách **rút lá dưới đáy cùng** của Draw Pile thay vì lá trên đỉnh (cực kỳ hữu hiệu khi đỉnh bài đang có `Imploding Kitten` lật ngửa!).
- **Alter the Future (3x) (Thay Đổi Tương Lai 3 Lá)**: Bí mật xem **3 lá trên cùng** của Draw Pile và **sắp xếp lại thứ tự của chúng** theo ý muốn.
- **Targeted Attack (2x) (Tấn Công Chỉ Định)**: Giống `Attack`, nhưng được **chỉ định bất kỳ người chơi nào trên bàn** làm mục tiêu tiếp theo phải chịu 2 lượt (hoặc $K + 2$ lượt nếu cộng dồn)!

### Nhóm 3: Bản Mở Rộng *Streaking Kittens*
- **Streaking Kitten (Mèo Chạy Rông)**: Khi cầm lá này trên tay, bạn có thể giữ **1 lá Exploding Kitten** trên tay mà không bị nổ!
- **Super Skip (Siêu Bỏ Lượt)**: Kết thúc ngay lập tức **TẤT CẢ các lượt đang nợ** (dù đang bị cộng dồn 2, 4 hay 6 lượt Attack) mà không cần rút bài!
- **See the Future (5x) (Thấu Thị 5 Lá)**: Bí mật xem trước **5 lá trên cùng** của Draw Pile.
- **Alter the Future (5x) (Thay Đổi Tương Lai 5 Lá)**: Bí mật xem và sắp xếp lại thứ tự **5 lá trên cùng** của Draw Pile.
- **Swap Top and Bottom (Đổi Đỉnh & Đáy)**: Hoán đổi vị trí của lá trên cùng và lá dưới đáy cùng của Draw Pile mà không cần nhìn.
- **Garbage Collection (Thu Gom Rác)**: Mọi người chơi còn sống mỗi người phải chọn 1 lá bài từ trên tay mình nhét trả vào Draw Pile, sau đó xáo lại toàn bộ Draw Pile!
- **Catomic Bomb (Bom Nguyên Tử Mèo)**: Kéo **toàn bộ các lá Exploding Kitten** đang nằm trong Draw Pile ra, xáo trộn các lá còn lại của Draw Pile, rồi đặt tất cả các lá Exploding Kitten đó **lên thẳng trên đỉnh Draw Pile**, đồng thời **kết thúc lượt của bạn mà không cần rút bài**!
- **Curse of the Cat Butt (Lời Nguyền Mông Mèo / Mù Bài)**: Chọn 1 người chơi; bài trên tay người đó bị xáo trộn và **úp mù (Blind)** cho đến khi họ rút thành công 1 lá bài mà không bị nổ!
- **Mark (Đánh Dấu)**: Chọn 1 người chơi và bắn dấu lên 1 lá bài ngẫu nhiên trên tay họ; lá bài bị đánh dấu sẽ bị **lật ngửa công khai** cho cả bàn nhìn thấy cho đến khi được đánh ra hoặc bị cướp!

### Nhóm 4: Bản Mở Rộng *Barking Kittens* & *Zombie Kittens*
- **Barking Kitten (x2) (Mèo Sủa)**: Khi đánh ra, nếu người khác đang giữ lá `Barking Kitten` còn lại, người đó lập tức bị nổ (phải dùng `Defuse` hoặc chết); nếu chưa ai lộ diện, nó chờ đến khi lá thứ 2 xuất hiện!
- **Bury (Chôn Giấu)**: Rút lá trên cùng của Draw Pile (xem bí mật mà không kích hoạt nổ), sau đó nhét nó lại vào bất kỳ vị trí nào trong Draw Pile và **kết thúc lượt**.
- **Personal Attack (3x) (Tự Tấn Công 3 Lượt)**: Tự buộc bản thân phải đi **3 lượt liên tiếp** (thường dùng kết hợp với bài câu giờ hoặc khi muốn rút nhiều bài an toàn ở đầu trận).
- **Share the Future (3x) (Chia Sẻ Tương Lai)**: Xem và sắp xếp lại 3 lá đầu của Draw Pile, sau đó cho người chơi kế tiếp cùng nhìn thấy 3 lá đó.
- **Potluck (Góp Bài Lên Đỉnh)**: Theo vòng từ bạn, mỗi người chơi chọn 1 lá bài trên tay đặt úp lên đỉnh Draw Pile.
- **I'll Take That (Đưa Đây Cho Tôi)**: Đặt trước mặt 1 người chơi khác; ở lần rút bài tiếp theo của họ, lá họ rút ra sẽ chuyển thẳng sang cho bạn (kể cả nếu đó là bom!).
- **Clone (Nhân Bản)**: Biến thành bản sao của lá bài nằm ngay trên đỉnh Discard Pile và kích hoạt hiệu ứng của lá đó.
- **Dig Deeper (Đào Sâu Hơn)**: Xem lá đầu tiên của Draw Pile: bạn có thể lấy nó và kết thúc lượt, hoặc lấy lá thứ 2 bên dưới nó (và trả lá đầu tiên lên lại đỉnh Draw Pile) để kết thúc lượt.

---

## 5. Luật Combo Đặc Biệt (Special Combos)

1. **Combo 2 Lá Cùng Loại (Pair — hoặc 1 Lá Mèo + 1 `Feral Cat`)**:
   - Chọn 1 đối thủ và **cướp ngẫu nhiên (mù) 1 lá bài** từ tay người đó.
2. **Combo 3 Lá Cùng Loại (Three of a Kind — có thể ghép cùng `Feral Cat`)**:
   - Chọn 1 đối thủ và **chỉ định tên loại lá bài** muốn xin (ví dụ: `Defuse`, `Nope`, `Super Skip`...). Nếu trên tay đối thủ có loại lá đó, họ tự động mất 1 lá đó sang tay bạn; nếu không có thì bạn không nhận được gì.
3. **Combo 5 Lá Khác Nhau (5 Different Cards)**:
   - Chọn lấy lại **bất kỳ 1 lá bài nào đang nằm trong Discard Pile** lên tay!
