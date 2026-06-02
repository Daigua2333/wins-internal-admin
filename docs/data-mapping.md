# Data Mapping

当前前端 mock 模块和未来数据库表的对应关系：

## Dashboard

- 来源：
  - `orders`
  - `trip_costs`
  - `vehicles`
  - `drivers`
  - `guides`
  - `quotations`

## 订单管理

- 主表：`orders`
- 关联：
  - `customers`
  - `vehicles`
  - `drivers`
  - `guides`
  - `quotations`
  - `trip_costs`

## 车辆管理

- 主表：`vehicles`

## 司机管理

- 主表：`drivers`
- 可选关联：`profiles`

## 导游管理

- 主表：`guides`
- 可选关联：`profiles`

## 客户信息

- 主表：`customers`

## 报价单管理

- 主表：`quotations`
- 关联：`customers`

## 成本与利润

- 主表：
  - `orders`
  - `trip_costs`

## 系统设置

- 当前建议第一阶段保留在代码或单独参数表中。
- 如果后续需要动态配置，可新增：
  - `app_settings`
  - `notification_rules`
  - `role_permissions`
