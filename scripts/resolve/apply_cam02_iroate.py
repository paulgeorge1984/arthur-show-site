#!/usr/bin/env python3
"""cam02 系クリップへ iroate_227 (25% ミックス) のグレードを一括適用する。

デイリー2本編集のカメラ補完作業用。スレッドで確定した方針:

  * cam2Y は維持する (cam2X は赤み・彩度がさらに強くなるため使わない)
  * cam02 にはキー処理後に iroate_227.cube を 25% 程度で混ぜる
    (100% は顔と赤襟が過彩度、白飛び・黒潰れ気味になる)
  * 再開後の B06 (cam02B) だけ、その上に露出・WB の個別補正を足す

25% ミックスはノードの Key Output Gain で作るが、スクリプト API から
Key Output Gain は直接触れない。そのため「25% を仕込んだ基準クリップ」を
1つ作り、そのノードグラフを CopyGrades で対象クリップへ配るという形を取る。
Codex が現在位置と B06 代表カットに入れた 25% が、そのまま基準クリップになる。

使い方 (DaVinci Resolve Studio を起動し、対象タイムラインを開いた状態で):

    # 1. 何が対象になるか確認するだけ (既定は dry-run、何も変更しない)
    python3 apply_cam02_iroate.py

    # 2. 基準クリップを再生ヘッド位置に置いてから、複製バックアップ付きで適用
    python3 apply_cam02_iroate.py --apply --backup

    # 3. 再開後 B06 に露出 +、WB を暖色へ寄せる補正も足す
    python3 apply_cam02_iroate.py --apply --backup \
        --restart-frame 123456 --cdl-node 4 --b06-gain 1.06 --b06-wb 0.02

元 R2 を壊さないための安全策:

  * 既定は dry-run。--apply を付けない限り一切書き換えない。
  * --backup で適用前にタイムラインを複製する。
  * --require-name で「複製プレビュー側の名前」を必須にできる。既定では
    タイムライン名を表示して確認を求める。
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass

# macOS の DaVinci Resolve Studio 既定のスクリプトモジュール置き場
RESOLVE_MODULE_PATHS = [
    "/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Scripting/Modules",
    "/opt/resolve/Developer/Scripting/Modules",
]

# cam02 / cam2 / cam02B ... を拾う。cam01 は拾わない
CAM02_PATTERN = re.compile(r"cam0?2", re.IGNORECASE)
# 再開後クリップの名前側の手がかり (B06 / cam02B など)
POST_RESTART_PATTERN = re.compile(r"cam0?2b|b0?6", re.IGNORECASE)


def load_resolve():
    """DaVinciResolveScript を読み込んで resolve オブジェクトを返す。"""
    try:
        import DaVinciResolveScript as dvr  # type: ignore
    except ImportError:
        for path in RESOLVE_MODULE_PATHS:
            sys.path.append(path)
        try:
            import DaVinciResolveScript as dvr  # type: ignore
        except ImportError:
            sys.exit(
                "DaVinciResolveScript が見つかりません。Resolve Studio がインストールされ、\n"
                "RESOLVE_SCRIPT_API / PYTHONPATH が通っているか確認してください。"
            )

    resolve = dvr.scriptapp("Resolve")
    if resolve is None:
        sys.exit("Resolve に接続できません。Resolve を起動し、外部スクリプトを許可してください。")
    return resolve


@dataclass
class Target:
    item: object
    track: int
    name: str
    start: int
    post_restart: bool

    def label(self) -> str:
        tag = "B06(再開後)" if self.post_restart else "cam2Y"
        return f"  V{self.track} @{self.start:>9}  {self.name[:44]:<44} {tag}"


def collect_targets(timeline, restart_frame: int | None) -> list[Target]:
    """タイムライン上の cam02 系クリップを列挙する。"""
    targets: list[Target] = []
    for track in range(1, timeline.GetTrackCount("video") + 1):
        for item in timeline.GetItemListInTrack("video", track) or []:
            name = item.GetName() or ""
            if not CAM02_PATTERN.search(name):
                continue
            start = item.GetStart()
            # 再開後判定は、指定があればフレーム位置を優先。無ければ名前で判定
            if restart_frame is not None:
                post = start >= restart_frame
            else:
                post = bool(POST_RESTART_PATTERN.search(name))
            targets.append(Target(item, track, name, start, post))
    targets.sort(key=lambda t: (t.start, t.track))
    return targets


def pick_reference(timeline, targets: list[Target], ref_start: int | None):
    """25% を仕込んだ基準クリップを決める。"""
    if ref_start is not None:
        for t in targets:
            if t.start == ref_start:
                return t.item, f"開始フレーム {ref_start} のクリップ"
        sys.exit(f"開始フレーム {ref_start} の cam02 クリップが見つかりません。")

    current = timeline.GetCurrentVideoItem()
    if current is None:
        sys.exit(
            "再生ヘッド位置にクリップがありません。\n"
            "25% を入れてある基準クリップに再生ヘッドを置くか、--ref-start で指定してください。"
        )
    name = current.GetName() or ""
    if not CAM02_PATTERN.search(name):
        sys.exit(
            f"再生ヘッド位置のクリップ '{name}' は cam02 系ではありません。\n"
            "iroate 25% を入れた cam02 のクリップに再生ヘッドを合わせてください。"
        )
    return current, f"再生ヘッド位置のクリップ '{name}'"


def apply_b06_cdl(target: Target, node_index: int, gain: float, wb: float, verbose: bool) -> bool:
    """再開後 B06 に露出・WB の個別補正を CDL で足す。

    wb > 0 で暖色 (R を上げ B を下げる)、wb < 0 で寒色へ寄る。
    node_index は基準グレードの「調整用に空けてあるノード」を指す。
    """
    r = gain * (1.0 + wb)
    g = gain
    b = gain * (1.0 - wb)
    cdl = {
        "NodeIndex": str(node_index),
        "Slope": f"{r:.4f} {g:.4f} {b:.4f}",
        "Offset": "0.0 0.0 0.0",
        "Power": "1.0 1.0 1.0",
        "Saturation": "1.0",
    }
    ok = bool(target.item.SetCDL(cdl))
    if verbose:
        state = "OK" if ok else "失敗"
        print(f"    CDL node{node_index} slope=({r:.3f}, {g:.3f}, {b:.3f}) -> {state}")
    return ok


def main() -> int:
    p = argparse.ArgumentParser(
        description="cam02 系クリップへ iroate_227 25% のグレードを一括適用する",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    p.add_argument("--apply", action="store_true",
                   help="実際に書き換える。付けない場合は対象を表示するだけ")
    p.add_argument("--backup", action="store_true",
                   help="適用前にタイムラインを複製してバックアップする")
    p.add_argument("--require-name", metavar="SUBSTR",
                   help="タイムライン名にこの文字列が含まれない場合は中止する (元 R2 の誤爆防止)")
    p.add_argument("--ref-start", type=int, metavar="FRAME",
                   help="基準クリップを開始フレームで指定する。既定は再生ヘッド位置のクリップ")
    p.add_argument("--restart-frame", type=int, metavar="FRAME",
                   help="このフレーム以降を再開後 B06 として扱う。未指定なら名前で判定")
    p.add_argument("--include-post-restart", action="store_true",
                   help="再開後 B06 にも基準グレードをコピーする (既定はコピーする)")
    p.add_argument("--skip-post-restart", action="store_true",
                   help="再開後 B06 には基準グレードをコピーしない (別グレードで管理する場合)")
    p.add_argument("--cdl-node", type=int, metavar="N",
                   help="再開後 B06 の露出・WB 補正を入れるノード番号 (基準グレードの空きノード)")
    p.add_argument("--b06-gain", type=float, default=1.0, metavar="X",
                   help="再開後 B06 の露出倍率。1.06 で約 +0.08 stop 相当 (既定 1.0)")
    p.add_argument("--b06-wb", type=float, default=0.0, metavar="X",
                   help="再開後 B06 の WB。正で暖色、負で寒色。0.02 程度が目安 (既定 0.0)")
    args = p.parse_args()

    if args.skip_post_restart and args.include_post_restart:
        p.error("--include-post-restart と --skip-post-restart は同時に使えません")

    resolve = load_resolve()
    project = resolve.GetProjectManager().GetCurrentProject()
    if project is None:
        sys.exit("プロジェクトが開かれていません。")
    timeline = project.GetCurrentTimeline()
    if timeline is None:
        sys.exit("タイムラインが開かれていません。")

    tl_name = timeline.GetName()
    print(f"プロジェクト : {project.GetName()}")
    print(f"タイムライン : {tl_name}")

    if args.require_name and args.require_name not in tl_name:
        sys.exit(
            f"中止しました。タイムライン名に '{args.require_name}' が含まれていません。\n"
            "複製したプレビュー側のタイムラインを開いているか確認してください。"
        )

    targets = collect_targets(timeline, args.restart_frame)
    if not targets:
        sys.exit("cam02 系のクリップが 1 つも見つかりませんでした。クリップ名を確認してください。")

    pre = [t for t in targets if not t.post_restart]
    post = [t for t in targets if t.post_restart]
    print(f"\ncam02 系クリップ {len(targets)} 個 (cam2Y {len(pre)} / 再開後 B06 {len(post)})")
    for t in targets:
        print(t.label())

    ref_item, ref_desc = pick_reference(timeline, targets, args.ref_start)
    node_count = ref_item.GetNumNodes()
    print(f"\n基準グレード : {ref_desc} (ノード数 {node_count})")
    print("  ※ このクリップに iroate_227 が 25% で入っていることを Color ページで確認してください")

    if args.cdl_node is not None and args.cdl_node > node_count:
        sys.exit(
            f"--cdl-node {args.cdl_node} は基準グレードのノード数 {node_count} を超えています。\n"
            "B06 補正用に空きノードを 1 つ足してから実行してください。"
        )

    copy_targets = list(pre)
    if not args.skip_post_restart:
        copy_targets += post
    # 基準クリップ自身は既に 25% が入っているので除外する
    copy_targets = [t for t in copy_targets if t.item != ref_item]

    print(f"\nグレードをコピーする対象 : {len(copy_targets)} 個")
    if args.cdl_node is not None:
        print(
            f"再開後 B06 の追加補正   : {len(post)} 個 "
            f"(node{args.cdl_node}, gain={args.b06_gain}, wb={args.b06_wb})"
        )

    if not args.apply:
        print("\n--- dry-run です。何も変更していません。実行するには --apply を付けてください ---")
        return 0

    if args.backup:
        backup_name = f"{tl_name} _backup"
        dup = timeline.DuplicateTimeline(backup_name)
        if dup:
            print(f"\nバックアップを作成しました : {dup.GetName()}")
            # 複製すると新しいタイムラインが開くことがあるので元に戻す
            project.SetCurrentTimeline(timeline)
        else:
            sys.exit("バックアップの作成に失敗しました。中止します。")

    resolve.OpenPage("color")

    print("\nグレードをコピー中...")
    items = [t.item for t in copy_targets]
    ok = bool(ref_item.CopyGrades(items)) if items else True
    if not ok:
        print("  CopyGrades が失敗を返しました。Color ページが開いているか確認してください。")
        return 1
    print(f"  {len(items)} 個へコピーしました。")

    if args.cdl_node is not None and post:
        print("\n再開後 B06 に露出・WB 補正を適用中...")
        failed = 0
        for t in post:
            if not apply_b06_cdl(t, args.cdl_node, args.b06_gain, args.b06_wb, verbose=True):
                failed += 1
        if failed:
            print(f"  {failed} 個で失敗しました。ノード番号を確認してください。")
            return 1
        print(f"  {len(post)} 個へ適用しました。")

    print("\n完了しました。Color ページで cam01 との見え方を確認してください。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
