/* 🦴 骨架屏组件 — 首屏加载占位动画 */

export function SkeletonCard(props) {
  return (
    <div class="section-card skeleton-card" style={props.style}>
      {props.children || (
        <>
          <div class="skeleton-line skeleton-title" />
          <div class="skeleton-line skeleton-body" />
          <div class="skeleton-line skeleton-body skeleton-body--short" />
        </>
      )}
    </div>
  );
}

export function SkeletonText(props) {
  return (
    <div
      class="skeleton-line"
      classList={{
        "skeleton-title": props.variant === "title",
        "skeleton-body--short": props.variant === "short",
      }}
      style={{ width: props.width, height: props.height }}
    />
  );
}

export function SkeletonCircle(props) {
  return (
    <div
      class="skeleton-circle"
      style={{ width: props.size || 48, height: props.size || 48 }}
    />
  );
}

/* Default: full-page loading with multiple skeleton cards */
export default function SkeletonPage() {
  return (
    <>
      <SkeletonCard>
        <div class="skeleton-line skeleton-title" style="width:40%;" />
        <div class="skeleton-line skeleton-body" />
        <div class="skeleton-line skeleton-body" />
        <div class="skeleton-line skeleton-body skeleton-body--short" />
      </SkeletonCard>
      <SkeletonCard>
        <div class="skeleton-line skeleton-title" style="width:55%;" />
        <div class="skeleton-line skeleton-body" />
        <div class="skeleton-line skeleton-body skeleton-body--short" />
      </SkeletonCard>
      <div style="display:flex;gap:8px;margin-top:8px;">
        <SkeletonCircle size={48} />
        <div style="flex:1;">
          <div class="skeleton-line skeleton-title" style="width:30%;" />
          <div class="skeleton-line skeleton-body" />
        </div>
      </div>
    </>
  );
}
