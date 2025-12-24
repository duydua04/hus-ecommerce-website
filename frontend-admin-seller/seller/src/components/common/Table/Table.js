import React from "react";
import "./Table.scss";

const Table = ({ columns = [], data = [], actions = null }) => {
  return (
    <div className="toolbar__table">
      <table className="table">
        <thead className="table__head">
          <tr className="table__row">
            {columns.map((col, index) => (
              <th
                key={index}
                className={`table__header 
                  ${col.hideMobile ? "table__header--hide-mobile" : ""} 
                  ${col.hideTablet ? "table__header--hide-tablet" : ""}`}
              >
                {col.label}
              </th>
            ))}

            {actions && (
              <th className="table__header table__header--actions">
                Hành động
              </th>
            )}
          </tr>
        </thead>

        <tbody className="table__body">
          {data.length === 0 ? (
            <tr className="table__row">
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="table__cell table__cell--empty"
              >
                Không có dữ liệu
              </td>
            </tr>
          ) : (
            data.map((item, rowIndex) => (
              <tr key={rowIndex} className="table__row">
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`table__cell ${col.className || ""} 
                      ${col.hideMobile ? "table__cell--hide-mobile" : ""}
                      ${col.hideTablet ? "table__cell--hide-tablet" : ""}`}
                  >
                    {col.render
                      ? col.render(item[col.key], item)
                      : item[col.key]}
                  </td>
                ))}

                {actions && (
                  <td className="table__cell table__cell--actions">
                    <div className="table__actions">
                      {actions.map((act, i) => (
                        <button
                          key={i}
                          className={act.className}
                          title={act.label}
                          onClick={() => act.onClick(item)}
                        >
                          <i className={`${act.icon} action-btn__icon`} />
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
